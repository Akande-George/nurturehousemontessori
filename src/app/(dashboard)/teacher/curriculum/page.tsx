import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getTeacherStudents } from "@/lib/db/students";
import {
  getSchoolObservations,
  getStudentCurriculumProgress,
} from "@/lib/db/montessori";
import { getSchoolCurriculum } from "@/lib/db/curriculum";
import { CURRICULUM } from "@/lib/curriculum/curriculum";
import { buildProgressMap, type ProgressMap } from "@/lib/curriculum/progress-utils";
import { CurriculumIndexClient, type ObservationsSummary } from "./CurriculumIndexClient";

/** How many observations the Recent observations tab shows. */
const RECENT_OBSERVATIONS_LIMIT = 20;

export default async function TeacherCurriculumIndexPage() {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return (
      <CurriculumIndexClient
        students={[]}
        progressByStudent={{}}
        curriculum={CURRICULUM}
        observationsByStudent={{}}
        recentObservations={[]}
      />
    );
  }

  const [students, { visible: curriculum, all: catalog }] = await Promise.all([
    getTeacherStudents(supabase, {
      teacherId: user.id,
      schoolId: school.id,
      schoolType: school.type,
    }),
    getSchoolCurriculum(supabase, school.id),
  ]);
  const progressRows = await Promise.all(
    students.map((s) => getStudentCurriculumProgress(supabase, s.id)),
  );
  const observations = await getSchoolObservations(supabase, school.id, catalog);

  const progressByStudent: Record<string, ProgressMap> = {};
  const observationsByStudent: Record<string, ObservationsSummary> = {};
  students.forEach((s, i) => {
    progressByStudent[s.id] = buildProgressMap(progressRows[i]);
    observationsByStudent[s.id] = { count: 0, latest: null };
  });
  // Rows arrive newest first, so the first one seen for a child is its latest.
  for (const o of observations) {
    const rec = observationsByStudent[o.student_id];
    if (!rec) continue;
    rec.count += 1;
    if (!rec.latest) rec.latest = o;
  }

  return (
    <CurriculumIndexClient
      students={students}
      progressByStudent={progressByStudent}
      curriculum={curriculum}
      observationsByStudent={observationsByStudent}
      recentObservations={observations.slice(0, RECENT_OBSERVATIONS_LIMIT)}
    />
  );
}
