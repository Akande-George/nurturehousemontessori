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
