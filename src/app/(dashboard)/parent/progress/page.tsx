import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import {
  getStudentCurriculumProgress,
  getStudentProgress,
  getStudentObservations,
  type Progress,
} from "@/lib/db/montessori";
import { getCatalogsForSchools } from "@/lib/db/curriculum";
import type { SchoolCurriculum } from "@/lib/curriculum/school-curriculum";
import { buildProgressMap, type ProgressMap } from "@/lib/curriculum/progress-utils";
import { ParentProgressClient, type ObsLite } from "./ParentProgressClient";

export default async function AcademicProgressPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  if (!supabase) {
    return (
      <ParentProgressClient
        children={[]}
        progressByStudent={{}}
        academicByStudent={{}}
        obsByStudent={{}}
        curriculumBySchool={{}}
      />
    );
  }

  const children = await getStudentsForParent(supabase, user.id);
  const catalogs = await getCatalogsForSchools(supabase, children.map((c) => c.school_id));
  const [progressRows, academicRows, obsRows] = await Promise.all([
    Promise.all(children.map((c) => getStudentCurriculumProgress(supabase, c.id))),
    Promise.all(children.map((c) => getStudentProgress(supabase, c.id))),
    Promise.all(
      children.map((c) =>
        getStudentObservations(supabase, c.id, catalogs.get(c.school_id)?.all),
      ),
    ),
  ]);
  const curriculumBySchool: Record<string, SchoolCurriculum> = Object.fromEntries(catalogs);

  const progressByStudent: Record<string, ProgressMap> = {};
  const academicByStudent: Record<string, Progress | null> = {};
  const obsByStudent: Record<string, ObsLite[]> = {};
  children.forEach((c, i) => {
    progressByStudent[c.id] = buildProgressMap(progressRows[i]);
    academicByStudent[c.id] = academicRows[i];
    obsByStudent[c.id] = obsRows[i].map((o) => ({
      id: o.id,
      content: o.content,
      created_at: o.created_at,
      areaName: o.leaf?.areaName ?? null,
      activityName: o.leaf?.activityName ?? null,
      leafName: o.leaf?.leafName ?? null,
    }));
  });

  return (
    <ParentProgressClient
      children={children}
      progressByStudent={progressByStudent}
      academicByStudent={academicByStudent}
      obsByStudent={obsByStudent}
      curriculumBySchool={curriculumBySchool}
    />
  );
}
