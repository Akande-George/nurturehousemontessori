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
