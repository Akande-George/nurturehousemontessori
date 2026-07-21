-- Phase 2 migration 6/7: computed logic (report-card ranking, curriculum + platform stats)

-- Nigerian letter scale (mirrors demo-store gradeFor exactly).
create or replace function public.grade_for(p numeric)
returns text language sql immutable as $$
  select case
    when p >= 70 then 'A' when p >= 60 then 'B' when p >= 50 then 'C'
    when p >= 45 then 'D' when p >= 40 then 'E' else 'F' end;
$$;

create or replace function public.remark_for(p numeric)
returns text language sql immutable as $$
  select case
    when p >= 70 then 'Excellent' when p >= 60 then 'Very Good' when p >= 50 then 'Good'
    when p >= 45 then 'Fair' when p >= 40 then 'Pass' else 'Fail' end;
$$;

create or replace function public.teacher_remark_for(p numeric)
returns text language sql immutable as $$
  select case
    when p >= 70 then 'An excellent result. Keep up the great work.'
    when p >= 60 then 'A very good performance this term.'
    when p >= 50 then 'A good effort. There is room to aim higher.'
    when p >= 40 then 'A fair result. More focus is needed next term.'
    else 'This result needs significant improvement. Extra support recommended.' end;
$$;

create or replace function public.principal_remark_for(p numeric)
returns text language sql immutable as $$
  select case
    when p >= 60 then 'A commendable result. Well done.'
    when p >= 40 then 'Satisfactory. Continue to work hard.'
    else 'Below expectation. Please see the class teacher.' end;
$$;

-- Class-ranked report-card computation. Returns one row per (student, subject) with
-- the student's aggregate columns repeated, ranked across the whole class for the term.
create or replace function public.compute_report_card(
  p_class_id uuid, p_term term, p_year text
)
returns table (
  student_id uuid,
  subject_id uuid,
  ca_total numeric,
  exam_score numeric,
  total numeric,
  grade text,
  remark text,
  subject_position int,
  overall_total numeric,
  overall_average numeric,
  overall_grade text,
  overall_position int,
  class_size int,
  promotion_status promotion_status
)
language sql stable as $$
  with cls_students as (
    select id as sid from public.students where class_id = p_class_id
  ),
  cls_subjects as (
    select distinct s.subject_id as subid
    from public.assessment_scores s
    where s.class_id = p_class_id and s.term = p_term
  ),
  grid as (
    select
      st.sid as student_id,
      sub.subid as subject_id,
      coalesce((select sum((e->>'score')::numeric)
                from jsonb_array_elements(sc.ca) e), 0) as ca_total,
      coalesce((sc.exam->>'score')::numeric, 0) as exam_score
    from cls_students st
    cross join cls_subjects sub
    left join public.assessment_scores sc
      on sc.student_id = st.sid
     and sc.class_id = p_class_id
     and sc.subject_id = sub.subid
     and sc.term = p_term
  ),
  totals as (
    select student_id, subject_id, ca_total, exam_score,
           (ca_total + exam_score) as total
    from grid
  ),
  ranked as (
    select t.*,
           rank() over (partition by subject_id order by total desc) as subject_position
    from totals t
  ),
  agg as (
    select student_id,
           sum(total) as overall_total,
           round(avg(total)::numeric, 1) as overall_average,
           (select count(*)::int from cls_students) as class_size
    from totals
    group by student_id
  ),
  agg_ranked as (
    select a.*, rank() over (order by overall_average desc) as overall_position
    from agg a
  )
  select
    r.student_id,
    r.subject_id,
    r.ca_total,
    r.exam_score,
    r.total,
    public.grade_for(r.total) as grade,
    public.remark_for(r.total) as remark,
    r.subject_position::int,
    a.overall_total,
    a.overall_average,
    public.grade_for(a.overall_average) as overall_grade,
    a.overall_position::int,
    a.class_size,
    (case when p_term = 'third'
          then (case when a.overall_average >= 40 then 'promoted' else 'repeated' end)
          else 'pending' end)::promotion_status as promotion_status
  from ranked r
  join agg_ranked a on a.student_id = r.student_id
  order by a.overall_position, r.subject_id;
$$;

-- Per-status counts of a student's curriculum progress rows. "not_started" is
-- derived app-side (catalog size − sum) since the leaf catalog lives in code.
create or replace function public.curriculum_stats(p_student_id uuid)
returns table (status curriculum_status, count bigint)
language sql stable as $$
  select status, count(*)
  from public.curriculum_progress
  where student_id = p_student_id
  group by status;
$$;

-- Super-admin platform aggregates. RLS-safe: platform admins see all schools;
-- ordinary users only their own (harmless). No SECURITY DEFINER needed.
create or replace function public.platform_stats()
returns table (
  school_id uuid,
  student_count bigint,
  staff_count bigint,
  class_count bigint,
  notice_count bigint
)
language sql stable as $$
  select
    s.id,
    (select count(*) from public.students st where st.school_id = s.id),
    (select count(*) from public.memberships m
       where m.school_id = s.id and m.role in ('admin','teacher')),
    (select count(*) from public.classes c where c.school_id = s.id),
    (select count(*) from public.notices n where n.school_id = s.id)
  from public.schools s;
$$;
