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
