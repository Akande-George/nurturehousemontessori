import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import {
  getSchoolObservations,
  getStudentCurriculumProgress,
  type ObservationWithLeaf,
} from "@/lib/db/montessori";
import {
  buildProgressMap,
  getCurriculumStats,
  touchedPercent,
} from "@/lib/curriculum/progress-utils";
import { TeacherObservationsClient } from "./TeacherObservationsClient";

export default async function TeacherObservationsIndexPage() {
  const { school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return (
      <TeacherObservationsClient students={[]} perStudent={{}} recentObs={[]} />
    );
  }

  const students = await getSchoolStudents(supabase, school.id);
  const observations = await getSchoolObservations(supabase, school.id);
  const progressRows = await Promise.all(
    students.map((s) => getStudentCurriculumProgress(supabase, s.id)),
  );

  const perStudent: Record<
    string,
    { obsCount: number; currPct: number; latest: ObservationWithLeaf | null }
  > = {};
  students.forEach((s, i) => {
    const map = buildProgressMap(progressRows[i]);
    perStudent[s.id] = {
      obsCount: 0,
      currPct: touchedPercent(getCurriculumStats(map).overall),
      latest: null,
    };
  });
  for (const o of observations) {
    const rec = perStudent[o.student_id];
    if (!rec) continue;
    rec.obsCount += 1;
    if (!rec.latest) rec.latest = o;
  }

  const recentObs = observations.slice(0, 20);

  return (
    <TeacherObservationsClient
      students={students}
      perStudent={perStudent}
      recentObs={recentObs}
    />
  );
}
