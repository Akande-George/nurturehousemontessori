-- Mid-term reports.
--
-- conference_reports held exactly one report per child per term, so a mid-term
-- report had nowhere to live. `report_type` splits that: a child may now have a
-- 'midterm' report AND a 'termly' one for the same term, and nothing else about
-- the document changes — same snapshot/narrative/sections shape, same editor,
-- same parent view.
--
-- text + check rather than a new enum, matching resources.type and
-- daily_activity_logs.activity_type: adding a third kind later is then an
-- ALTER of the check, not an enum migration.

alter table public.conference_reports
  add column if not exists report_type text not null default 'termly';

alter table public.conference_reports
  drop constraint if exists conference_reports_report_type_ck;
alter table public.conference_reports
  add constraint conference_reports_report_type_ck
  check (report_type in ('termly', 'midterm'));

-- Swap the uniqueness rule. Every pre-existing row is a termly report (the
-- column default), so widening the key can't collide.
--
-- The old constraint was declared inline as `unique (student_id,
-- academic_year, term)`, so Postgres named it itself. Rather than trust that
-- name, find whichever unique constraint covers exactly those three columns
-- and drop it.
do $$
declare
  conname_to_drop text;
begin
  select c.conname into conname_to_drop
    from pg_constraint c
   where c.conrelid = 'public.conference_reports'::regclass
     and c.contype = 'u'
     and (
       select array_agg(a.attname::text order by a.attname)
         from unnest(c.conkey) as k(attnum)
         join pg_attribute a
           on a.attrelid = c.conrelid and a.attnum = k.attnum
     ) = array['academic_year', 'student_id', 'term']
   limit 1;

  if conname_to_drop is not null then
    execute format(
      'alter table public.conference_reports drop constraint %I',
      conname_to_drop
    );
  end if;
end $$;

create unique index if not exists conference_reports_student_year_term_type_idx
  on public.conference_reports (student_id, academic_year, term, report_type);
