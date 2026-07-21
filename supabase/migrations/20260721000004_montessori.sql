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
