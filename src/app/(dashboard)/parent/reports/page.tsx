import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getStudentDailyReports, type DailyReport } from "@/lib/db/montessori";
import { ParentReportsClient } from "./ParentReportsClient";

export default async function DailyReportsPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  if (!supabase) return <ParentReportsClient children={[]} reportsByChild={{}} />;

  const children = await getStudentsForParent(supabase, user.id);
  const reports = await getStudentDailyReports(supabase, children.map((c) => c.id));

  const reportsByChild: Record<string, DailyReport[]> = {};
  for (const r of reports) {
    (reportsByChild[r.student_id] = reportsByChild[r.student_id] ?? []).push(r);
  }

  return <ParentReportsClient children={children} reportsByChild={reportsByChild} />;
}
