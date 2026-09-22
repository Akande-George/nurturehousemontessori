-- Managed classrooms for Montessori schools.
--
-- Montessori has no `classes` rows — a child's room lives in students.classroom
-- as free text, which meant a teacher could not be assigned to a room. This
-- table is the per-school list the admin maintains (name + editable age-group
-- label). students.classroom and teacher_classroom_assignments.classroom keep
-- storing the room NAME, so existing reads (reports, attendance, curriculum,
-- daily log) are untouched; renaming a room carries the name across both.

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  age_group text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);
create index classrooms_school_idx on public.classrooms (school_id);

alter table public.classrooms enable row level security;

create policy classrooms_read on public.classrooms for select
  using (is_school_member(school_id));
create policy classrooms_write on public.classrooms for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

-- Backfill: register every classroom already in use, so no child is left in a
-- room the admin cannot see. Age-group labels are left blank — they are edited
-- in the Classrooms screen.
--
-- "Nurture Bud" was a one-off misspelling of "Nurture Buds" (4 children), so
-- merge it first to avoid registering the same room twice.
update public.students set classroom = 'Nurture Buds' where classroom = 'Nurture Bud';

insert into public.classrooms (school_id, name, sort_order)
select school_id, classroom, (row_number() over (partition by school_id order by classroom)) - 1
from (
  select distinct school_id, classroom
  from public.students
  where classroom is not null and btrim(classroom) <> ''
) t
on conflict (school_id, name) do nothing;
