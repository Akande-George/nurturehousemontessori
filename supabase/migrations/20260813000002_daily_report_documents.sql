-- Daily report, rebuilt as a full document (same shape as conference_reports).
--
-- daily_reports already existed but nothing ever inserted into it — the only
-- writer was updateDailyReportStatus. The real per-day data lives in
-- daily_activity_logs, observations, curriculum_practices and activity_posts,
-- so the report now snapshots those the same way the progress report does:
--   snapshot  -- auto-collected facts, frozen at generate, never edited
--   narrative -- everything the teacher types
--   sections  -- which sections appear on this report
-- The pre-existing `content` column is left untouched for any legacy rows.

alter table public.daily_reports
  add column if not exists snapshot jsonb not null default '{}'::jsonb,
  add column if not exists narrative jsonb not null default '{}'::jsonb,
  add column if not exists sections jsonb not null default '{}'::jsonb,
  add column if not exists generated_at timestamptz not null default now();

-- One report per child per day. Defensive: collapse any pre-existing duplicates
-- (keeping the most recently updated) before adding the constraint.
delete from public.daily_reports a
  using public.daily_reports b
 where a.student_id = b.student_id
   and a.report_date = b.report_date
   and (a.updated_at, a.id) < (b.updated_at, b.id);

create unique index if not exists daily_reports_student_date_idx
  on public.daily_reports (student_id, report_date);

create index if not exists daily_reports_school_status_idx
  on public.daily_reports (school_id, status);

-- Supports the per-child, per-day care timeline lookup.
create index if not exists daily_activity_logs_student_date_idx
  on public.daily_activity_logs (student_id, log_date);

-- Fix: the original policy let parents read DRAFT daily reports. Now that a
-- draft holds unfinished teacher commentary, gate parents on status = 'sent',
-- matching how conference_reports gates on 'published'.
drop policy if exists daily_reports_read on public.daily_reports;

create policy daily_reports_staff_read on public.daily_reports for select
  using (is_school_staff(school_id));
create policy daily_reports_parent_read on public.daily_reports for select
  using (status = 'sent' and is_parent_of(student_id));
