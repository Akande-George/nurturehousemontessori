import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentById, getTeacherStudents } from "@/lib/db/students";
import { getStudentObservations } from "@/lib/db/montessori";
import { StudentObservationClient } from "./StudentObservationClient";

export default async function StudentObservationPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { user, school } = await requireRole("teacher");
  const { studentId } = await params;
  const supabase = await createClient();

  const student = supabase ? await getStudentById(supabase, studentId) : null;
  // Observations open only for a child this teacher is assigned to — the same
  // rule as every other teacher screen.
  const teacherStudents =
    supabase && school
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
    !teacherStudents.some((s) => s.id === student.id)
  ) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Link
          href="/teacher/observations"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-montessori-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-xl font-serif text-slate-900">Student not found</h1>
      </div>
    );
  }

  const observations = await getStudentObservations(supabase, student.id);

  return (
    <StudentObservationClient
      student={student}
      teacherStudents={teacherStudents}
      observations={observations}
    />
  );
}
