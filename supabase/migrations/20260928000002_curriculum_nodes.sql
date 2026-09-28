-- Per-school edits to the Montessori curriculum.
--
-- The album itself stays in code (src/lib/curriculum/curriculum.ts) and
-- observations / curriculum_progress / activity_posts keep storing its text
-- leaf ids. This table is an OVERLAY on top of it:
--   * a row whose node_id matches a built-in id overrides that node (rename,
--     description, hide, reorder) — built-ins are never deleted, only hidden;
--   * a row with a new node_id ('c-' || uuid) and a parent_node_id is a custom
--     area / section / activity / variation the school added.
-- src/lib/curriculum/school-curriculum.ts merges the two. With no rows (or no
-- table yet) the school simply sees the built-in catalog.

create table public.curriculum_nodes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  node_id text not null,
  kind text not null check (kind in ('area','subcategory','activity','variation')),
  parent_node_id text,
  name text,
  description text,
  hidden boolean not null default false,
  sort_order int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, node_id)
);
create index curriculum_nodes_school_idx on public.curriculum_nodes (school_id);

alter table public.curriculum_nodes enable row level security;

create policy curriculum_nodes_read on public.curriculum_nodes for select
  using (is_school_member(school_id));
create policy curriculum_nodes_insert on public.curriculum_nodes for insert
  with check (is_school_staff(school_id));
create policy curriculum_nodes_update on public.curriculum_nodes for update
  using (is_school_staff(school_id)) with check (is_school_staff(school_id));
create policy curriculum_nodes_delete on public.curriculum_nodes for delete
  using (is_school_staff(school_id));
