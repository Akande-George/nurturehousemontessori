import Link from "next/link";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentById } from "@/lib/db/students";
import { getStudentCurriculumProgress } from "@/lib/db/montessori";
import { buildProgressMap } from "@/lib/curriculum/progress-utils";
import { StudentCurriculumClient } from "./StudentCurriculumClient";

export default async function StudentCurriculumPage({
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
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-slate-500">Student not found.</p>
        <Link href="/teacher/curriculum" className="text-montessori-primary text-sm font-medium mt-3 inline-block">
          ← Back to curriculum
        </Link>
      </div>
    );
  }

  const rows = await getStudentCurriculumProgress(supabase, student.id);
  const progress = buildProgressMap(rows);

  return <StudentCurriculumClient student={student} progress={progress} />;
}
