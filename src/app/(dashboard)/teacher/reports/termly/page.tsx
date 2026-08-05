import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import {
  getSchoolObservations,
  getStudentProgress,
  type Progress,
} from "@/lib/db/montessori";
import type { ObsLite } from "@/lib/montessori/term-summary";
import { TeacherTermlyClient } from "./TeacherTermlyClient";

export default async function TeacherTermlyReportPage() {
  const { school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return <TeacherTermlyClient students={[]} obsByStudent={{}} reportByStudent={{}} />;
  }

  const [students, observations] = await Promise.all([
    getSchoolStudents(supabase, school.id),
    getSchoolObservations(supabase, school.id),
  ]);
  const reports = await Promise.all(
    students.map((s) => getStudentProgress(supabase, s.id)),
  );

  const obsByStudent: Record<string, ObsLite[]> = {};
  for (const s of students) obsByStudent[s.id] = [];
  for (const o of observations) {
    (obsByStudent[o.student_id] ??= []).push({
      areaName: o.leaf?.areaName ?? null,
      activityName: o.leaf?.activityName ?? null,
      leafName: o.leaf?.leafName ?? null,
      content: o.content,
      created_at: o.created_at,
    });
  }
  const reportByStudent: Record<string, Progress | null> = {};
  students.forEach((s, i) => {
    reportByStudent[s.id] = reports[i];
  });

  return (
    <TeacherTermlyClient
      students={students.map((s) => ({ id: s.id, name: s.name, classroom: s.classroom }))}
      obsByStudent={obsByStudent}
      reportByStudent={reportByStudent}
    />
  );
}
