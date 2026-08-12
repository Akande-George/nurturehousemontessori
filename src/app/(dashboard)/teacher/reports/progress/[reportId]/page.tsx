import Link from "next/link";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getConferenceReportById } from "@/lib/db/conferenceReports";
import { ProgressReportEditorClient } from "./ProgressReportEditorClient";

export default async function TeacherProgressReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  await requireRole("teacher");
  const { reportId } = await params;
  const supabase = await createClient();
  const report = supabase
    ? await getConferenceReportById(supabase, reportId)
    : null;

  if (!report || !report.snapshot) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-slate-500">Progress report not found.</p>
        <Link
          href="/teacher/reports/progress"
          className="text-sm text-montessori-primary hover:underline"
        >
          Back to progress reports
        </Link>
      </div>
    );
  }

  return (
    <ProgressReportEditorClient
      id={report.id}
      title={report.title}
      status={report.status}
      snapshot={report.snapshot}
      narrative={report.narrative}
      sections={report.sections}
    />
  );
}
