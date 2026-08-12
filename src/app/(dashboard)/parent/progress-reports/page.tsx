import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getStudentConferenceReports } from "@/lib/db/conferenceReports";
import { ProgressReportsClient } from "./ProgressReportsClient";

export default async function ParentProgressReportsPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  if (!supabase) {
    return <ProgressReportsClient childrenList={[]} reports={[]} />;
  }

  const childrenList = await getStudentsForParent(supabase, user.id);
  // RLS already restricts parents to published reports for their own children.
  const reports = await getStudentConferenceReports(
    supabase,
    childrenList.map((c) => c.id),
  );

  return (
    <ProgressReportsClient
      childrenList={childrenList.map((c) => ({
        id: c.id,
        name: c.name,
        avatar_color: c.avatar_color,
      }))}
      reports={reports.map((r) => ({
        id: r.id,
        studentId: r.student_id,
        title: r.title,
        term: r.term,
        academicYear: r.academic_year,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        publishedAt: r.published_at,
      }))}
    />
  );
}
