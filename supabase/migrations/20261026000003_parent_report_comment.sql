-- The comment above the signature line is the PARENT's, not the teacher's.
--
-- It is deliberately NOT part of `narrative`: narrative is the teacher's half
-- of the document and is frozen the moment the report is published, which is
-- exactly when the parent needs to write. Separate columns keep "published and
-- locked" true for everything the teacher wrote while still letting the family
-- reply.
--
-- Writes go through an RPC rather than an RLS policy on purpose. A policy
-- permissive enough for `update ... where is_parent_of(student_id)` would let a
-- parent rewrite ANY column on their child's report — the teacher's narrative
-- and the frozen snapshot included — because RLS gates rows, not columns. The
-- SECURITY DEFINER function below is the whole write surface: three columns,
-- published reports only, the caller's own child only.

alter table public.conference_reports
  add column if not exists parent_comment    text,
  add column if not exists parent_comment_at timestamptz,
  add column if not exists parent_comment_by uuid references public.profiles(id) on delete set null;

create or replace function public.set_parent_report_comment(
  p_report  uuid,
  p_comment text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid;
  v_status  conference_report_status;
  v_clean   text;
begin
  v_clean := nullif(btrim(coalesce(p_comment, '')), '');

  if length(coalesce(v_clean, '')) > 4000 then
    raise exception 'Comment is too long' using errcode = 'check_violation';
  end if;

  select student_id, status into v_student, v_status
    from public.conference_reports
   where id = p_report;

  if v_student is null then
    raise exception 'Report not found' using errcode = 'no_data_found';
  end if;

  -- is_parent_of() is itself SECURITY DEFINER and reads auth.uid(), which is
  -- still the CALLER's id inside this function.
  if not public.is_parent_of(v_student) then
    raise exception 'Not authorized' using errcode = 'insufficient_privilege';
  end if;

  -- A draft is unfinished teacher commentary the parent cannot even see.
  if v_status <> 'published' then
    raise exception 'That report has not been published yet'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.conference_reports
     set parent_comment    = v_clean,
         -- Clearing the comment clears who wrote it and when, so a blank
         -- comment never carries a stale byline onto the printed report.
         parent_comment_at = case when v_clean is null then null else now() end,
         parent_comment_by = case when v_clean is null then null else auth.uid() end
   where id = p_report;
end;
$$;

revoke all on function public.set_parent_report_comment(uuid, text) from public;
grant execute on function public.set_parent_report_comment(uuid, text) to authenticated;
