import Link from "next/link";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentById, getTeacherStudents } from "@/lib/db/students";
import {
  getStudentCurriculumProgress,
  getStudentObservations,
} from "@/lib/db/montessori";
import { getSchoolCurriculum } from "@/lib/db/curriculum";
import { buildProgressMap } from "@/lib/curriculum/progress-utils";
import { StudentCurriculumClient } from "./StudentCurriculumClient";

export default async function StudentCurriculumPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { user, school } = await requireRole("teacher");
  const { studentId } = await params;
  const supabase = await createClient();

  const student = supabase ? await getStudentById(supabase, studentId) : null;
  // A record book opens only for a child this teacher is assigned to — the
  // same rule as every other teacher screen.
  const assigned =
    supabase && school && student && student.school_id === school.id
      ? await getTeacherStudents(supabase, {
          teacherId: user.id,
          schoolId: school.id,
          schoolType: school.type,
        })
      : [];

  if (
    !supabase ||
    !school ||
    !student ||
    !assigned.some((s) => s.id === student.id)
  ) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-slate-500">Student not found.</p>
        <Link href="/teacher/curriculum" className="text-montessori-primary text-sm font-medium mt-3 inline-block">
          ← Back to curriculum
        </Link>
      </div>
    );
  }

  const [rows, { visible: curriculum, all: catalog }] = await Promise.all([
    getStudentCurriculumProgress(supabase, student.id),
    getSchoolCurriculum(supabase, school.id),
  ]);
  const progress = buildProgressMap(rows);
  // Notes resolve their leaf against the full catalog so a note filed against
  // a since-hidden lesson still names it.
  const observations = await getStudentObservations(supabase, student.id, catalog);

  // `curriculum` drives the browsable tree; `catalog` (hidden nodes included)
  // backs the record dialog's picker, so a lesson that has since been hidden
  // can still be found when a record is being filed against it.
  return (
    <StudentCurriculumClient
      student={student}
      teacherStudents={assigned}
      progress={progress}
      curriculum={curriculum}
      catalog={catalog}
      observations={observations}
      currentUserId={user.id}
    />
  );
}
