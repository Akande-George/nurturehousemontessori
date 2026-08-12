import Link from "next/link";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getDailyReportFullById } from "@/lib/db/dailyReports";
import { DailyReportEditorClient } from "./DailyReportEditorClient";

export default async function TeacherDailyReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  await requireRole("teacher");
  const { reportId } = await params;
  const supabase = await createClient();
  const report = supabase
    ? await getDailyReportFullById(supabase, reportId)
    : null;

  if (!report || !report.snapshot) {
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
