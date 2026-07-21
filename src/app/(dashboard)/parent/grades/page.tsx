import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getStudentReportCards, getReportCardById } from "@/lib/db/reportCards";
import type { ReportCard, ReportCardRow } from "@/lib/db/types";
import { ParentGradesClient } from "./ParentGradesClient";

export type ChildGrades = { card: ReportCard; rows: ReportCardRow[] } | null;

export default async function ParentGradesPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  const children = await getStudentsForParent(supabase!, user.id);

  const gradesByChild: Record<string, ChildGrades> = {};
  await Promise.all(
    children.map(async (c) => {
      const cards = await getStudentReportCards(supabase!, c.id);
      const latest = cards[0];
      if (!latest) {
        gradesByChild[c.id] = null;
        return;
      }
      const full = await getReportCardById(supabase!, latest.id);
      gradesByChild[c.id] = full
        ? { card: full, rows: full.rows }
        : { card: latest, rows: [] };
    }),
  );

  const { data: subjects } = await supabase!.from("subjects").select("id,name");
  const subjectNames: Record<string, string> = {};
  (subjects ?? []).forEach((s) => {
    subjectNames[s.id] = s.name;
  });

  return (
    <ParentGradesClient
      childrenList={children}
      gradesByChild={gradesByChild}
      subjectNames={subjectNames}
    />
  );
}
