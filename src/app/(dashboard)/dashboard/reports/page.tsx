import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolDailyReports } from "@/lib/db/montessori";
import { getSchoolStudents } from "@/lib/db/students";
import { ReportsClient } from "./ReportsClient";

export default async function ReportsPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [reports, students] = await Promise.all([
    getSchoolDailyReports(supabase, school.id),
    getSchoolStudents(supabase, school.id),
  ]);

  const studentNames: Record<string, string> = {};
  const studentClassrooms: Record<string, string> = {};
  for (const s of students) {
    studentNames[s.id] = s.name;
    if (s.classroom) studentClassrooms[s.id] = s.classroom;
  }

  return (
    <ReportsClient
      reports={reports}
      studentNames={studentNames}
      studentClassrooms={studentClassrooms}
    />
  );
}
