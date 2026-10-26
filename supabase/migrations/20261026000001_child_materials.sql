-- Child Materials — per-child documents a teacher shares with that child's
-- parents (PDFs, Word documents, worksheets).
--
-- Deliberately NOT the Resource Library (`resources`): a resource is published
-- once for the whole school and every parent sees it, whereas a material is
-- addressed to ONE child and only that child's parents may read it. Keeping
-- them as separate tables puts that difference in the RLS policy rather than
-- in application code.
--
-- The file itself lives in Cloudinary (resource_type = raw). `file_url` is the
-- delivery URL and `storage_public_id` is what we destroy on delete. Parents
-- never see either: the app streams the file through
-- /api/child-materials/[id], which re-checks the row is readable first.

create table public.child_materials (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references public.schools(id)  on delete cascade,
  student_id        uuid not null references public.students(id) on delete cascade,
  uploaded_by       uuid references public.profiles(id) on delete set null,
  title             text not null,
  description       text,
  category          text not null default 'resource',  -- resource|worksheet|assessment|medical|admin|other
  file_url          text not null,
  file_name         text not null,
  file_ext          text not null default '',          -- lowercase, no dot: pdf|docx|…
  file_size_bytes   bigint,
  storage_public_id text,
  created_at        timestamptz not null default now()
);

create index child_materials_student_idx
  on public.child_materials (student_id, created_at desc);
create index child_materials_school_idx
  on public.child_materials (school_id, created_at desc);

alter table public.child_materials enable row level security;

-- Two select policies OR together: all staff of the school, plus the parents
-- of this one child. Everyone else sees no rows at all.
create policy child_materials_staff_read on public.child_materials for select
  using (is_school_staff(school_id));
create policy child_materials_parent_read on public.child_materials for select
  using (is_parent_of(student_id));

-- Only staff write, and only for a child who actually belongs to the school
-- they are staff of.
--
-- That second half is load-bearing, not belt-and-braces. school_id arrives
-- with the insert, so a policy testing it alone would let a staff member of
-- school A write a row {school_id: A, student_id: <a child at school B>}
-- straight to PostgREST, bypassing the server action — and the parent read
-- policy below keys on student_id, so that document would surface in another
-- school's family portal. student_school() (defined in the RLS migration,
-- SECURITY DEFINER) ties the two columns together, the same way the
-- student_parents and student_medications policies do.
--
-- Which children a TEACHER may upload for is narrowed further still in the
-- server action (their own classrooms / classes), the same deny-by-default
-- rule as getTeacherStudents and recordAttendance.
create policy child_materials_write on public.child_materials for all
  using (
    is_school_staff(school_id)
    and student_school(student_id) = school_id
  )
  with check (
    is_school_staff(school_id)
    and student_school(student_id) = school_id
  );
