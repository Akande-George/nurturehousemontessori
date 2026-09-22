import Link from "next/link";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getDailyReportFullById } from "@/lib/db/dailyReports";
import { getTeacherStudents } from "@/lib/db/students";
import { DailyReportEditorClient } from "./DailyReportEditorClient";

export default async function TeacherDailyReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { user, school } = await requireRole("teacher");
  const { reportId } = await params;
  const supabase = await createClient();
  const report = supabase
    ? await getDailyReportFullById(supabase, reportId)
    : null;

  // A report opens only for a child this teacher is assigned to — another
  // room's report is "not found", not "forbidden".
  const assigned =
    supabase && school && report
      ? await getTeacherStudents(supabase, {
          teacherId: user.id,
          schoolId: school.id,
          schoolType: school.type,
        })
      : [];

  if (
    !report ||
    !report.snapshot ||
    !assigned.some((s) => s.id === report.student_id)
  ) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-slate-500">Daily report not found.</p>
        <Link
          href="/teacher/reports/daily"
          className="text-sm text-montessori-primary hover:underline"
        >
          Back to daily reports
        </Link>
      </div>
    );
  }

  return (
    <DailyReportEditorClient
      id={report.id}
      status={report.status}
      snapshot={report.snapshot}
      narrative={report.narrative}
      sections={report.sections}
    />
  );
}
