-- ============================================================================
-- School platform — full schema, RLS, and functions.
-- Paste this whole file into: Supabase Dashboard → SQL Editor → New query → Run.
-- Run ONCE on a fresh/empty project (project ref: permrmpopesweqmzvhar).
-- ============================================================================


-- ===== 20260721000001_extensions_enums.sql =====
-- Phase 2 migration 1/7: extensions + enums
-- Fresh schema for the multi-school platform (supersedes the removed stale migration).

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Roles a user can hold. super_admin is the global platform admin (no membership row).
create type user_role as enum ('super_admin', 'admin', 'teacher', 'parent');

create type school_type as enum ('montessori', 'regular');
create type school_status as enum ('active', 'pending', 'suspended');

create type term as enum ('first', 'second', 'third');
create type invoice_status as enum ('unpaid', 'paid');
create type promotion_status as enum ('promoted', 'repeated', 'pending');
create type daily_report_status as enum ('draft', 'sent');
create type attendance_status as enum ('present', 'absent', 'late', 'excused');

-- Montessori curriculum leaf status (mirrors demo-store CurriculumStatus).
create type curriculum_status as enum ('not_started', 'introduced', 'developing', 'proficient');

-- Daily-report age-band polymorphism.
create type age_group as enum ('infant_0_2', 'primary_3_6', 'lower_7_9');

create type application_status as enum ('submitted', 'accepted', 'rejected');
create type invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');


-- ===== 20260721000002_core_tenancy.sql =====
-- Phase 2 migration 2/7: core tenancy (schools, profiles, memberships)

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type school_type not null,
  logo_url text not null default '/logo2.png',
  contact_email text,
  phone text,
  address text,
  -- RGB channel triplets, e.g. {"primary":"12 92 76", ...} — consumed by SchoolThemeProvider
  theme jsonb not null default '{"primary":"12 92 76","secondary":"88 160 56","accent":"252 211 3"}'::jsonb,
  programs text[] not null default '{}',
  status school_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- 1:1 with auth.users. is_platform_admin bypasses tenant scoping (super_admin).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  avatar_color text not null default 'bg-slate-200',
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- (user, school, role). A normal user has exactly one membership; super_admin has none.
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, school_id)
);

create index memberships_user_idx on public.memberships (user_id);
create index memberships_school_idx on public.memberships (school_id);

-- Auto-create a profile row when an auth user is created. Signup/invite flows pass
-- full_name / avatar_color / is_platform_admin via raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_color, is_platform_admin)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_color', 'bg-slate-200'),
    coalesce((new.raw_user_meta_data->>'is_platform_admin')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ===== 20260721000003_academics.sql =====
-- Phase 2 migration 3/7: academics (shared + regular-school)

-- Classes (regular schools). Montessori uses students.classroom text instead.
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  level int not null default 0,          -- ordinal for promotion ordering
  class_teacher_id uuid references public.profiles(id) on delete set null,
  academic_year text not null,
  created_at timestamptz not null default now()
);
create index classes_school_idx on public.classes (school_id);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now()
);
create index subjects_school_idx on public.subjects (school_id);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  avatar_color text not null default 'bg-slate-200',
  date_of_birth date,
  age_group age_group,
  enrolled_at date,
  -- montessori
  classroom text,
  teacher_id uuid references public.profiles(id) on delete set null,
  -- regular
  class_id uuid references public.classes(id) on delete set null,
  emergency_contact jsonb,               -- {name, phone, relationship}
  allergies text[] not null default '{}',
  interests text[] not null default '{}',
  medical_notes text,
  frequent_late_pickup boolean not null default false,
  created_at timestamptz not null default now()
);
create index students_school_idx on public.students (school_id);
create index students_class_idx on public.students (class_id);

-- M2M: a student may have one or many parents.
create table public.student_parents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  is_primary boolean not null default false,
  relationship text,
  unique (student_id, parent_id)
);
create index student_parents_parent_idx on public.student_parents (parent_id);

create table public.student_medications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null,
  dosage text,
  time text,
  notes text
);

create table public.class_subject_teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  unique (class_id, subject_id)
);
create index cst_teacher_idx on public.class_subject_teachers (teacher_id);

-- CA components + exam stored as jsonb (written/read as a unit). One row per
-- (student, class, subject, term).
create table public.assessment_scores (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  term term not null,
  academic_year text not null,
  ca jsonb not null default '[]'::jsonb,          -- [{label,score,max}]
  exam jsonb not null default '{"score":0,"max":60}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (student_id, class_id, subject_id, term)
);
create index scores_class_term_idx on public.assessment_scores (class_id, subject_id, term);

-- Published report-card snapshot (remarks + published_at). Rows are computed on
-- read via compute_report_card RPC and snapshotted here on publish.
create table public.report_cards (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  term term not null,
  academic_year text not null,
  total_score numeric not null default 0,
  average numeric not null default 0,
  overall_position int,
  class_size int,
  overall_grade text,
  teacher_remark text,
  principal_remark text,
  promotion_status promotion_status not null default 'pending',
  published_at timestamptz not null default now(),
  unique (student_id, class_id, term)
);

create table public.report_card_rows (
  id uuid primary key default gen_random_uuid(),
  report_card_id uuid not null references public.report_cards(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  ca_total numeric not null default 0,
  exam_score numeric not null default 0,
  total numeric not null default 0,
  grade text,
  remark text,
  subject_position int
);

create table public.timetable_periods (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 5),
  start_time text not null,
  end_time text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index timetable_class_idx on public.timetable_periods (class_id);

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  teacher_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  created_at timestamptz not null default now()
);
create index homework_class_idx on public.homework (class_id);

create table public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'assigned',    -- assigned|submitted|graded
  submitted_at timestamptz,
  grade text,
  note text,
  unique (homework_id, student_id)
);


-- ===== 20260721000004_montessori.sql =====
-- Phase 2 migration 4/7: montessori pedagogy

-- leaf_id references the app-side curriculum catalog (src/lib/curriculum), kept as text.
create table public.observations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  leaf_id text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index observations_student_idx on public.observations (student_id);

create table public.curriculum_progress (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  leaf_id text not null,
  status curriculum_status not null default 'not_started',
  updated_at timestamptz not null default now(),
  unique (student_id, leaf_id)
);
create index curriculum_progress_student_idx on public.curriculum_progress (student_id);

create table public.curriculum_practices (
  id uuid primary key default gen_random_uuid(),
  curriculum_progress_id uuid not null references public.curriculum_progress(id) on delete cascade,
  practiced_on date not null
);

create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  age_group age_group not null,
  report_date date not null,
  week_label text,
  status daily_report_status not null default 'draft',
  general_mood text,
  -- polymorphic-by-age-band body (careEntries / workCycle / subjectProgress / health / comments)
  content jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  updated_at timestamptz not null default now()
);
create index daily_reports_student_idx on public.daily_reports (student_id);

create table public.daily_activity_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  log_date date not null,
  log_time text,
  activity_type text not null,           -- meals|nap|hygiene|temperature
  value text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.activity_posts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  caption text,
  image_url text,
  leaf_id text,
  created_at timestamptz not null default now()
);
create index activity_posts_student_idx on public.activity_posts (student_id);

create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.activity_posts(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, parent_id)
);

-- Per-student narrative progress (montessori areas).
create table public.progress (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  term text,
  academic_year text,
  areas jsonb not null default '[]'::jsonb,
  strengths text[] not null default '{}',
  areas_for_growth text[] not null default '{}',
  teacher_comments text,
  teacher_name text,
  recommendations jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (student_id)
);

-- Teacher/admin-only guidance notes — never parent-visible (enforced in RLS).
create table public.admin_comments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  kind text not null,                    -- guidance|move-recommendation
  body text not null,
  suggested_move text,
  created_at timestamptz not null default now()
);

create table public.teacher_classroom_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  classroom text not null,
  unique (school_id, teacher_id, classroom)
);


-- ===== 20260721000005_operations.sql =====
-- Phase 2 migration 5/7: operations (notices, billing, attendance, calendar, onboarding)

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  content text not null,
  audience text not null default 'all-parents',
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index notices_school_idx on public.notices (school_id);

create table public.notice_reads (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (notice_id, parent_id)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  parent_id uuid references public.profiles(id) on delete set null,
  description text not null,
  amount_cents bigint not null default 0,
  issued_at timestamptz not null default now(),
  due_date date,
  status invoice_status not null default 'unpaid',
  paid_at timestamptz
);
create index invoices_student_idx on public.invoices (student_id);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  status attendance_status not null,
  recorded_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);
create index attendance_date_idx on public.attendance (school_id, date);

create table public.after_school_enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  parent_id uuid references public.profiles(id) on delete set null,
  enrolled_at timestamptz not null default now(),
  unique (student_id)
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  type text not null default 'academic',   -- academic|activity|holiday|staff
  audience text not null default 'public',  -- public|staff
  all_day boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index calendar_school_idx on public.calendar_events (school_id);

-- Invitations for parents/teachers/admins to join a school (magic-link/OTP onboarding).
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  email text not null,
  role user_role not null,
  student_id uuid references public.students(id) on delete set null,  -- parent invites tied to a child
  token text not null unique,
  status invitation_status not null default 'pending',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create index invitations_email_idx on public.invitations (email);

-- Public waitlist / admissions applications.
create table public.enrollment_applications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  child_name text not null,
  parent_name text not null,
  parent_email text not null,
  parent_phone text,
  details jsonb not null default '{}'::jsonb,
  status application_status not null default 'submitted',
  created_at timestamptz not null default now()
);
create index enrollment_school_idx on public.enrollment_applications (school_id);


-- ===== 20260721000006_functions_views.sql =====
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


-- ===== 20260721000007_rls.sql =====
-- Phase 2 migration 7/7: Row Level Security helpers + policies

-- ---- Helper predicates (SECURITY DEFINER so they can read memberships/profiles
-- ---- regardless of the caller's own RLS) ----

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_school_member(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
      or exists (select 1 from public.memberships
                 where user_id = auth.uid() and school_id = p_school);
$$;

create or replace function public.is_school_staff(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
      or exists (select 1 from public.memberships
                 where user_id = auth.uid() and school_id = p_school
                   and role in ('admin','teacher'));
$$;

create or replace function public.is_school_admin(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
      or exists (select 1 from public.memberships
                 where user_id = auth.uid() and school_id = p_school and role = 'admin');
$$;

create or replace function public.is_parent_of(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
      or exists (select 1 from public.student_parents
                 where student_id = p_student and parent_id = auth.uid());
$$;

create or replace function public.student_school(p_student uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select school_id from public.students where id = p_student;
$$;

-- Enable RLS everywhere.
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.student_parents enable row level security;
alter table public.student_medications enable row level security;
alter table public.class_subject_teachers enable row level security;
alter table public.assessment_scores enable row level security;
alter table public.report_cards enable row level security;
alter table public.report_card_rows enable row level security;
alter table public.timetable_periods enable row level security;
alter table public.homework enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.observations enable row level security;
alter table public.curriculum_progress enable row level security;
alter table public.curriculum_practices enable row level security;
alter table public.daily_reports enable row level security;
alter table public.daily_activity_logs enable row level security;
alter table public.activity_posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.progress enable row level security;
alter table public.admin_comments enable row level security;
alter table public.teacher_classroom_assignments enable row level security;
alter table public.notices enable row level security;
alter table public.notice_reads enable row level security;
alter table public.invoices enable row level security;
alter table public.attendance enable row level security;
alter table public.after_school_enrollments enable row level security;
alter table public.calendar_events enable row level security;
alter table public.invitations enable row level security;
alter table public.enrollment_applications enable row level security;

-- ---- Tenancy tables ----

create policy schools_read on public.schools for select
  using (is_platform_admin() or is_school_member(id));
create policy schools_write on public.schools for all
  using (is_platform_admin() or is_school_admin(id))
  with check (is_platform_admin() or is_school_admin(id));

-- Profiles: self, platform admin, or a co-member of one of your schools (so names render).
create policy profiles_read on public.profiles for select
  using (
    id = auth.uid() or is_platform_admin()
    or exists (
      select 1 from public.memberships m1
      join public.memberships m2 on m1.school_id = m2.school_id
      where m1.user_id = auth.uid() and m2.user_id = public.profiles.id
    )
  );
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid() or is_platform_admin())
  with check (id = auth.uid() or is_platform_admin());

create policy memberships_read on public.memberships for select
  using (user_id = auth.uid() or is_school_staff(school_id));
create policy memberships_write on public.memberships for all
  using (is_school_admin(school_id)) with check (is_school_admin(school_id));

-- ---- School-wide tables: members read, staff write ----

create policy classes_read on public.classes for select using (is_school_member(school_id));
create policy classes_write on public.classes for all using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy subjects_read on public.subjects for select using (is_school_member(school_id));
create policy subjects_write on public.subjects for all using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy cst_read on public.class_subject_teachers for select using (is_school_member(school_id));
create policy cst_write on public.class_subject_teachers for all using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy timetable_read on public.timetable_periods for select using (is_school_member(school_id));
create policy timetable_write on public.timetable_periods for all using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy tca_read on public.teacher_classroom_assignments for select using (is_school_member(school_id));
create policy tca_write on public.teacher_classroom_assignments for all using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy dal_read on public.daily_activity_logs for select using (is_school_staff(school_id) or is_parent_of(student_id));
create policy dal_write on public.daily_activity_logs for all using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy notices_read on public.notices for select using (is_school_member(school_id));
create policy notices_write on public.notices for all using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy calendar_read on public.calendar_events for select using (is_school_member(school_id));
create policy calendar_write on public.calendar_events for all using (is_school_staff(school_id)) with check (is_school_staff(school_id));

-- ---- Student-scoped tables: staff (whole school) + parent (own child) read; staff write ----

create policy students_read on public.students for select
  using (is_school_staff(school_id) or is_parent_of(id));
create policy students_write on public.students for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy student_parents_read on public.student_parents for select
  using (parent_id = auth.uid() or is_school_staff(student_school(student_id)));
create policy student_parents_write on public.student_parents for all
  using (is_school_staff(student_school(student_id))) with check (is_school_staff(student_school(student_id)));

create policy student_meds_read on public.student_medications for select
  using (is_parent_of(student_id) or is_school_staff(student_school(student_id)));
create policy student_meds_write on public.student_medications for all
  using (is_school_staff(student_school(student_id))) with check (is_school_staff(student_school(student_id)));

create policy scores_read on public.assessment_scores for select
  using (is_school_staff(school_id) or is_parent_of(student_id));
create policy scores_write on public.assessment_scores for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy report_cards_read on public.report_cards for select
  using (is_school_staff(school_id) or is_parent_of(student_id));
create policy report_cards_write on public.report_cards for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy report_card_rows_read on public.report_card_rows for select
  using (exists (select 1 from public.report_cards rc where rc.id = report_card_id
                 and (is_school_staff(rc.school_id) or is_parent_of(rc.student_id))));
create policy report_card_rows_write on public.report_card_rows for all
  using (exists (select 1 from public.report_cards rc where rc.id = report_card_id and is_school_staff(rc.school_id)))
  with check (exists (select 1 from public.report_cards rc where rc.id = report_card_id and is_school_staff(rc.school_id)));

create policy homework_read on public.homework for select
  using (is_school_member(school_id) or exists (
     select 1 from public.students st where st.class_id = homework.class_id and is_parent_of(st.id)));
create policy homework_write on public.homework for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy hw_sub_read on public.homework_submissions for select
  using (is_parent_of(student_id) or exists (
     select 1 from public.homework h where h.id = homework_id and is_school_staff(h.school_id)));
create policy hw_sub_write on public.homework_submissions for all
  using (exists (select 1 from public.homework h where h.id = homework_id and is_school_staff(h.school_id)))
  with check (exists (select 1 from public.homework h where h.id = homework_id and is_school_staff(h.school_id)));

create policy observations_read on public.observations for select
  using (is_school_staff(school_id) or is_parent_of(student_id));
create policy observations_write on public.observations for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy curriculum_read on public.curriculum_progress for select
  using (is_school_staff(school_id) or is_parent_of(student_id));
create policy curriculum_write on public.curriculum_progress for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy practices_read on public.curriculum_practices for select
  using (exists (select 1 from public.curriculum_progress cp where cp.id = curriculum_progress_id
                 and (is_school_staff(cp.school_id) or is_parent_of(cp.student_id))));
create policy practices_write on public.curriculum_practices for all
  using (exists (select 1 from public.curriculum_progress cp where cp.id = curriculum_progress_id and is_school_staff(cp.school_id)))
  with check (exists (select 1 from public.curriculum_progress cp where cp.id = curriculum_progress_id and is_school_staff(cp.school_id)));

create policy daily_reports_read on public.daily_reports for select
  using (is_school_staff(school_id) or is_parent_of(student_id));
create policy daily_reports_write on public.daily_reports for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy activity_read on public.activity_posts for select
  using (is_school_staff(school_id) or is_parent_of(student_id));
create policy activity_write on public.activity_posts for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

-- Parents like/unlike their own rows; staff/parents read.
create policy post_likes_read on public.post_likes for select
  using (exists (select 1 from public.activity_posts p where p.id = post_id
                 and (is_school_staff(p.school_id) or is_parent_of(p.student_id))));
create policy post_likes_write on public.post_likes for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());

create policy progress_read on public.progress for select
  using (is_school_staff(school_id) or is_parent_of(student_id));
create policy progress_write on public.progress for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

-- Admin comments: teacher/admin only — never parents.
create policy admin_comments_read on public.admin_comments for select
  using (is_school_staff(school_id));
create policy admin_comments_write on public.admin_comments for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy invoices_read on public.invoices for select
  using (is_school_staff(school_id) or is_parent_of(student_id));
create policy invoices_write on public.invoices for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy attendance_read on public.attendance for select
  using (is_school_staff(school_id) or is_parent_of(student_id));
create policy attendance_write on public.attendance for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

-- After-school: staff manage; parent can read + enroll/unenroll their own child.
create policy afterschool_read on public.after_school_enrollments for select
  using (is_school_staff(school_id) or is_parent_of(student_id));
create policy afterschool_parent_write on public.after_school_enrollments for all
  using (is_parent_of(student_id) or is_school_staff(school_id))
  with check (is_parent_of(student_id) or is_school_staff(school_id));

-- Notice reads: a parent tracks their own reads.
create policy notice_reads_read on public.notice_reads for select
  using (parent_id = auth.uid() or exists (
     select 1 from public.notices n where n.id = notice_id and is_school_staff(n.school_id)));
create policy notice_reads_write on public.notice_reads for all
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());

-- Invitations + applications: school staff manage. (Public application inserts go
-- through the service-role client server-side, which bypasses RLS.)
create policy invitations_all on public.invitations for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));
create policy applications_all on public.enrollment_applications for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));


-- ===== 20260721000008_resources_kits.sql =====
-- Phase 2 add-on: persist Resource Library + Kit Lists

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'article',   -- article | video | policy
  url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index resources_school_idx on public.resources (school_id);

create table public.kit_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  section_key text not null,               -- montessori programme key OR class id
  name text not null,
  required boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index kit_items_school_idx on public.kit_items (school_id);

alter table public.resources enable row level security;
alter table public.kit_items enable row level security;

create policy resources_read on public.resources for select
  using (is_school_member(school_id));
create policy resources_write on public.resources for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

create policy kit_items_read on public.kit_items for select
  using (is_school_member(school_id));
create policy kit_items_write on public.kit_items for all
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));

-- ===== 20260721000009_termly_character.sql =====
-- Termly report: character-trait ratings (trait -> 1..5), stored on the
-- existing per-student progress row.
alter table public.progress
  add column if not exists character_ratings jsonb not null default '{}'::jsonb;

-- ===== 20260812000001_invoice_upgrade.sql =====
-- Invoice upgrade: short human-readable invoice numbers (e.g. NHMS/0826/007),
-- itemised line items + tax, and school bank/payment details for the invoice footer.

alter table public.invoices
  add column if not exists invoice_no text,
  add column if not exists line_items jsonb not null default '[]'::jsonb,
  add column if not exists tax_cents bigint not null default 0;

alter table public.schools
  add column if not exists bank_name text,
  add column if not exists bank_account_name text,
  add column if not exists bank_account_number text;

-- Generates "PREFIX/MMYY/NNN" where PREFIX is the school-name initials (max 4),
-- MMYY comes from the issue date, and NNN is a per-school monthly sequence.
create or replace function public.set_invoice_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prefix text;
  mmyy text;
  seq int;
begin
  if new.invoice_no is not null then
    return new;
  end if;

  select left(string_agg(upper(left(w.word, 1)), '' order by w.ord), 4)
    into prefix
    from public.schools s
    cross join lateral unnest(string_to_array(s.name, ' ')) with ordinality as w(word, ord)
   where s.id = new.school_id
     and w.word ~ '^[A-Za-z]';

  if prefix is null or prefix = '' then
    prefix := 'INV';
  end if;

  mmyy := to_char(coalesce(new.issued_at, now()), 'MMYY');

  select coalesce(max(split_part(i.invoice_no, '/', 3)::int), 0) + 1
    into seq
    from public.invoices i
   where i.school_id = new.school_id
     and i.invoice_no like prefix || '/' || mmyy || '/%'
     and split_part(i.invoice_no, '/', 3) ~ '^\d+$';

  new.invoice_no := prefix || '/' || mmyy || '/' || lpad(seq::text, 3, '0');
  return new;
end;
$$;

drop trigger if exists invoices_set_invoice_no on public.invoices;
create trigger invoices_set_invoice_no
  before insert on public.invoices
  for each row execute function public.set_invoice_no();

-- Backfill numbers for invoices issued before this migration.
with numbered as (
  select i.id,
         to_char(i.issued_at, 'MMYY') as mmyy,
         s.name as school_name,
         row_number() over (
           partition by i.school_id, date_trunc('month', i.issued_at)
           order by i.issued_at, i.id
         ) as rn
    from public.invoices i
    join public.schools s on s.id = i.school_id
   where i.invoice_no is null
)
update public.invoices u
   set invoice_no = coalesce(
         (select left(string_agg(upper(left(w.word, 1)), '' order by w.ord), 4)
            from unnest(string_to_array(n.school_name, ' ')) with ordinality as w(word, ord)
           where w.word ~ '^[A-Za-z]'),
         'INV')
       || '/' || n.mmyy || '/' || lpad(n.rn::text, 3, '0')
  from numbered n
 where u.id = n.id;

create unique index if not exists invoices_school_invoice_no_idx
  on public.invoices (school_id, invoice_no);

-- ===== 20260813000001_conference_reports.sql =====
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

-- ===== 20260813000002_daily_report_documents.sql =====
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
