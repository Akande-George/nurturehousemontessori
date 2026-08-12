import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import { getSchoolDailyReports } from "@/lib/db/montessori";
import { DailyReportsListClient } from "./DailyReportsListClient";

export default async function TeacherDailyReportsPage() {
  const { school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return <DailyReportsListClient students={[]} reports={[]} />;
  }

  const [students, reports] = await Promise.all([
    getSchoolStudents(supabase, school.id),
    getSchoolDailyReports(supabase, school.id),
  ]);

  const nameById = new Map(students.map((s) => [s.id, s.name]));

  return (
    <DailyReportsListClient
      students={students.map((s) => ({
        id: s.id,
        name: s.name,
        classroom: s.classroom,
        hasAgeGroup: !!s.age_group,
      }))}
      reports={reports.map((r) => ({
        id: r.id,
        studentId: r.student_id,
        studentName: nameById.get(r.student_id) ?? "Unknown child",
        reportDate: r.report_date,
        status: r.status,
        mood: r.general_mood,
      }))}
    />
  );
}
