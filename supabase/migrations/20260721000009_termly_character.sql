-- Termly report: character-trait ratings (trait -> 1..5), stored on the
-- existing per-student progress row.
alter table public.progress
  add column if not exists character_ratings jsonb not null default '{}'::jsonb;
