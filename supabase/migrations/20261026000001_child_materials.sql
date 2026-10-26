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

-- Only staff write. Which children a TEACHER may upload for is narrowed again
-- in the server action (their own classrooms / classes), the same deny-by-
-- default rule as getTeacherStudents and recordAttendance.
create policy child_materials_write on public.child_materials for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));
