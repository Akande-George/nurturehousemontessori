-- Montessori Progress Report (Transparent Classroom style conference report).
--
-- One immutable, dated report per child per term. The jsonb split is
-- load-bearing:
--   snapshot  -- auto-collected facts, written once at generate, never edited
--   narrative -- everything the teacher types
--   sections  -- which sections appear on this report
-- so editing is a pure narrative/sections update and regenerating is a pure
-- snapshot replace.

create type conference_report_status as enum ('draft', 'published');

create table public.conference_reports (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools(id)  on delete cascade,
  student_id    uuid not null references public.students(id) on delete cascade,
  author_id     uuid references public.profiles(id) on delete set null,
  title         text not null default 'Progress Report',
  term          term not null,
  academic_year text not null,
  period_start  date not null,
  period_end    date not null,
  status        conference_report_status not null default 'draft',
  sections      jsonb not null default '{}'::jsonb,
  snapshot      jsonb not null default '{}'::jsonb,
  narrative     jsonb not null default '{}'::jsonb,
  generated_at  timestamptz not null default now(),
  published_at  timestamptz,
  updated_at    timestamptz not null default now(),
  constraint conference_reports_period_ck check (period_end >= period_start),
  unique (student_id, academic_year, term)
);
create index conference_reports_student_idx
  on public.conference_reports (student_id, period_end desc);
create index conference_reports_school_status_idx
  on public.conference_reports (school_id, status);

-- Missing FK index: the practices embed and the snapshot builder both walk
-- curriculum_practices by its parent progress row.
create index if not exists curriculum_practices_progress_idx
  on public.curriculum_practices (curriculum_progress_id);

alter table public.conference_reports enable row level security;

-- Two select policies OR together. Parents are gated on status at the row
-- level, so a draft stays invisible even if its id leaks.
create policy conference_reports_staff_read on public.conference_reports for select
  using (is_school_staff(school_id));
create policy conference_reports_parent_read on public.conference_reports for select
  using (status = 'published' and is_parent_of(student_id));
create policy conference_reports_write on public.conference_reports for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));
