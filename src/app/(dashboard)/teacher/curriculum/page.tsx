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
import { CurriculumIndexClient, type NotesSummary } from "./CurriculumIndexClient";

/** How many notes the Recent notes tab shows. */
const RECENT_NOTES_LIMIT = 20;

export default async function TeacherCurriculumIndexPage() {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return (
      <CurriculumIndexClient
        students={[]}
        progressByStudent={{}}
        curriculum={CURRICULUM}
        notesByStudent={{}}
        recentNotes={[]}
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
  const notesByStudent: Record<string, NotesSummary> = {};
  students.forEach((s, i) => {
    progressByStudent[s.id] = buildProgressMap(progressRows[i]);
    notesByStudent[s.id] = { count: 0, latest: null };
  });
  // Rows arrive newest first, so the first one seen for a child is its latest.
  for (const o of observations) {
    const rec = notesByStudent[o.student_id];
    if (!rec) continue;
    rec.count += 1;
    if (!rec.latest) rec.latest = o;
  }

  return (
    <CurriculumIndexClient
      students={students}
      progressByStudent={progressByStudent}
      curriculum={curriculum}
      notesByStudent={notesByStudent}
      recentNotes={observations.slice(0, RECENT_NOTES_LIMIT)}
    />
  );
}
