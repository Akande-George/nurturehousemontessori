import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentById, getSchoolStudents } from "@/lib/db/students";
import { getStudentObservations } from "@/lib/db/montessori";
import { StudentObservationClient } from "./StudentObservationClient";

export default async function StudentObservationPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { school } = await requireRole("teacher");
  const { studentId } = await params;
  const supabase = await createClient();

  const student = supabase ? await getStudentById(supabase, studentId) : null;

  if (!supabase || !school || !student || student.school_id !== school.id) {
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

  const [teacherStudents, observations] = await Promise.all([
    getSchoolStudents(supabase, school.id),
    getStudentObservations(supabase, student.id),
  ]);

  return (
    <StudentObservationClient
      student={student}
      teacherStudents={teacherStudents}
      observations={observations}
    />
  );
}
