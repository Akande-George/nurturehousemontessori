import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getStudentDailyReports } from "@/lib/db/montessori";
import { readDailyNarrative } from "@/lib/montessori/daily";
import { ParentReportsClient } from "./ParentReportsClient";

export default async function DailyReportsPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  if (!supabase) return <ParentReportsClient childrenList={[]} reports={[]} />;

  const childrenList = await getStudentsForParent(supabase, user.id);
  // RLS restricts parents to reports for their own children with status='sent'.
  const reports = await getStudentDailyReports(
    supabase,
    childrenList.map((c) => c.id),
  );

  return (
    <ParentReportsClient
      childrenList={childrenList.map((c) => ({
        id: c.id,
        name: c.name,
        avatar_color: c.avatar_color,
      }))}
      reports={reports.map((r) => {
        const narrative = readDailyNarrative(r.narrative);
        return {
          id: r.id,
          studentId: r.student_id,
          reportDate: r.report_date,
          mood: narrative.mood || r.general_mood,
          summary: narrative.summary,
        };
      })}
    />
  );
}
