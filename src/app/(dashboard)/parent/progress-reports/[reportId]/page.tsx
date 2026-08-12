import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getConferenceReportById } from "@/lib/db/conferenceReports";
import { PrintButton } from "@/components/PrintButton";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { ProgressReportDocument } from "@/components/montessori/ProgressReportDocument";
import { slugify } from "@/lib/montessori/conference";

export default async function ParentProgressReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  await requireRole("parent");
  const { reportId } = await params;
  const supabase = await createClient();
  const report = supabase
    ? await getConferenceReportById(supabase, reportId)
    : null;

  // RLS hides drafts from parents, so an unpublished report reads as missing.
  if (!report || !report.snapshot) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-slate-500">Progress report not found.</p>
        <Link
          href="/parent/progress-reports"
          className="text-sm text-montessori-primary hover:underline"
        >
          Back to progress reports
        </Link>
      </div>
    );
  }

  const filename = `${slugify(report.snapshot.header.childName)}-progress-report-${report.term}-${slugify(report.academic_year)}.pdf`;

  return (
    <div className="mx-auto max-w-4xl pb-20 duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/parent/progress-reports">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <DownloadPdfButton targetId="progress-report" filename={filename} />
          <PrintButton />
        </div>
      </div>

      <ProgressReportDocument
        title={report.title}
        snapshot={report.snapshot}
        narrative={report.narrative}
        sections={report.sections}
      />
    </div>
  );
}
