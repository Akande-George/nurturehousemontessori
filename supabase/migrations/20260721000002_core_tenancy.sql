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
