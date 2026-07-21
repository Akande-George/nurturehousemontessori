import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getClasses } from "@/lib/db/classes";
import { getSchoolStudents } from "@/lib/db/students";
import { ResultsClient, type CardSummary } from "./ResultsClient";

export default async function ResultsPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [classes, students, cardsRes] = await Promise.all([
    getClasses(supabase, school.id),
    getSchoolStudents(supabase, school.id),
    supabase
      .from("report_cards")
      .select(
        "id, student_id, class_id, term, average, overall_position, class_size",
      )
      .eq("school_id", school.id),
  ]);

  const studentsByClass: Record<string, { id: string; name: string }[]> = {};
  for (const s of students) {
    if (!s.class_id) continue;
    (studentsByClass[s.class_id] ??= []).push({ id: s.id, name: s.name });
  }

  const cards = (cardsRes.data ?? []) as CardSummary[];

  return (
    <ResultsClient
      classes={classes}
      studentsByClass={studentsByClass}
      cards={cards}
    />
  );
}
