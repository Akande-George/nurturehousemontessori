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
