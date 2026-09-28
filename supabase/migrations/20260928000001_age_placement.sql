-- Place Montessori children in the classroom that fits their age.
--
-- Run AFTER 20260922000001_classrooms.sql and 20260925000001_age_bands.sql.
--
-- Each classroom gets an age range in months (min inclusive, max exclusive —
-- "3–6 years" is 36..72). A child with a date of birth is put in the first
-- room, by sort order, whose range contains their age, and moves up on their
-- own as they get older. The age band (age_group) is derived from the date of
-- birth too, so daily reports always have one.
--
-- An admin's manual move into a room that doesn't fit the child's age pins
-- them there (classroom_pinned); automatic placement skips pinned children
-- until the pin is cleared on the child's profile.

alter table public.classrooms
  add column min_age_months int check (min_age_months >= 0),
  add column max_age_months int,
  add constraint classrooms_age_range_check
    check (min_age_months is null or max_age_months is null or max_age_months > min_age_months);

alter table public.students
  add column classroom_pinned boolean not null default false;

-- Whole months between a date of birth and today, the same way the app counts.
create or replace function public.age_in_months(p_dob date)
returns int
language sql
stable
as $$
  select (date_part('year', age(current_date, p_dob)) * 12
        + date_part('month', age(current_date, p_dob)))::int
$$;

-- The fixed Montessori age band for an age in months.
create or replace function public.age_band_for(p_months int)
returns age_group
language sql
immutable
as $$
  select case
    when p_months < 18 then 'nido_0_1_5'::age_group
    when p_months < 36 then 'toddler_1_5_3'::age_group
    when p_months < 72 then 'primary_3_6'::age_group
    when p_months < 108 then 'lower_7_9'::age_group
    else 'upper_9_12'::age_group
  end
$$;

-- Re-place children by age. Scope with p_school (one school) or p_student (one
-- child); with neither it runs across every Montessori school (the daily job).
-- Runs as the caller, so RLS limits an admin to their own school. Returns the
-- number of children whose classroom changed.
create or replace function public.place_students_by_age(
  p_school uuid default null,
  p_student uuid default null
)
returns int
language plpgsql
as $$
declare
  moved int;
begin
  -- Age band always follows the date of birth.
  update public.students s
  set age_group = public.age_band_for(public.age_in_months(s.date_of_birth))
  where s.date_of_birth is not null
    and (p_school is null or s.school_id = p_school)
    and (p_student is null or s.id = p_student)
    and s.age_group is distinct from public.age_band_for(public.age_in_months(s.date_of_birth));

  with target as (
    select s.id,
      (
        select c.name
        from public.classrooms c
        where c.school_id = s.school_id
          and c.min_age_months is not null
          and c.max_age_months is not null
          and public.age_in_months(s.date_of_birth) >= c.min_age_months
          and public.age_in_months(s.date_of_birth) < c.max_age_months
        order by c.sort_order, c.name
        limit 1
      ) as room
    from public.students s
    join public.schools sc on sc.id = s.school_id and sc.type = 'montessori'
    where s.date_of_birth is not null
      and not s.classroom_pinned
      and (p_school is null or s.school_id = p_school)
      and (p_student is null or s.id = p_student)
  )
  update public.students s
  set classroom = t.room
  from target t
  where s.id = t.id
    and t.room is not null
    and s.classroom is distinct from t.room;

  get diagnostics moved = row_count;
  return moved;
end;
$$;

grant execute on function public.age_in_months(date) to authenticated;
grant execute on function public.age_band_for(int) to authenticated;
grant execute on function public.place_students_by_age(uuid, uuid) to authenticated;

-- Daily age-up at 02:15 UTC. pg_cron may not be enabled on every project; if it
-- isn't, the app still re-places a school's children whenever an admin opens
-- the Students or Classrooms screen.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'place-students-by-age',
    '15 2 * * *',
    'select public.place_students_by_age()'
  );
exception when others then
  raise notice 'pg_cron unavailable (%); relying on in-app placement.', sqlerrm;
end;
$$;
