import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getTeacherStudents } from "@/lib/db/students";
import { getStudentCurriculumProgress } from "@/lib/db/montessori";
import { buildProgressMap, type ProgressMap } from "@/lib/curriculum/progress-utils";
import { CurriculumIndexClient } from "./CurriculumIndexClient";

export default async function TeacherCurriculumIndexPage() {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return <CurriculumIndexClient students={[]} progressByStudent={{}} />;
  }

  const students = await getTeacherStudents(supabase, {
    teacherId: user.id,
    schoolId: school.id,
    schoolType: school.type,
  });
  const progressRows = await Promise.all(
    students.map((s) => getStudentCurriculumProgress(supabase, s.id)),
  );
  const progressByStudent: Record<string, ProgressMap> = {};
  students.forEach((s, i) => {
    progressByStudent[s.id] = buildProgressMap(progressRows[i]);
  });

  return (
    <CurriculumIndexClient students={students} progressByStudent={progressByStudent} />
  );
}
