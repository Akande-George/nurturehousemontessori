import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import { getSchoolConferenceReports } from "@/lib/db/conferenceReports";
import { ProgressReportsListClient } from "./ProgressReportsListClient";

export default async function TeacherProgressReportsPage() {
  const { school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return <ProgressReportsListClient students={[]} reports={[]} />;
  }

  const [students, reports] = await Promise.all([
    getSchoolStudents(supabase, school.id),
    getSchoolConferenceReports(supabase, school.id),
  ]);

  const nameById = new Map(students.map((s) => [s.id, s.name]));

  return (
    <ProgressReportsListClient
      students={students.map((s) => ({ id: s.id, name: s.name }))}
      reports={reports.map((r) => ({
        id: r.id,
        studentName: nameById.get(r.student_id) ?? "Unknown child",
        title: r.title,
        term: r.term,
        academicYear: r.academic_year,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        status: r.status,
        updatedAt: r.updated_at,
      }))}
    />
  );
}
