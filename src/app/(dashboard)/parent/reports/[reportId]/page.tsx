import Link from "next/link";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent, getStudentById } from "@/lib/db/students";
import { getDailyReportById } from "@/lib/db/montessori";
import { PrintButton } from "@/components/PrintButton";

const AGE_GROUP_LABEL: Record<string, string> = {
  infant_0_2: "0–3 years",
  primary_3_6: "3–6 years",
  lower_7_9: "6–9 years",
};

type WorkEntry = { area?: string; activity?: string; level?: string };
type CareEntry = { label?: string; value?: string; time?: string };
type SubjectProgress = { subject?: string; activity?: string; note?: string };

function moodEmoji(mood: string | null) {
  if (mood === "Happy") return "😊";
  if (mood === "Sad") return "😢";
  return "😐";
}
function statusColor(status: string) {
  if (status === "sent") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default async function ParentReportDetailsPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { user } = await requireRole("parent");
  const { reportId } = await params;
  const supabase = await createClient();

  const report = supabase ? await getDailyReportById(supabase, reportId) : null;
  const children = supabase ? await getStudentsForParent(supabase, user.id) : [];
  const accessible = !!report && children.some((c) => c.id === report.student_id);
  const student = report && supabase ? await getStudentById(supabase, report.student_id) : null;

  if (!supabase || !report || !student || !accessible) {
    return (
      <div className="max-w-3xl mx-auto pb-20">
        <Card className="border-dashed border-slate-200 shadow-none mt-10">
          <CardContent className="py-14 text-center">
            <p className="text-base font-medium text-slate-800">Report not found</p>
            <p className="text-sm text-slate-500 mt-1">
              The report link may be invalid, or this report is not assigned to your child.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/parent/reports">Back to Daily Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const content = (report.content ?? {}) as Record<string, unknown>;
  const workCycle = Array.isArray(content.workCycle) ? (content.workCycle as WorkEntry[]) : [];
  const careEntries = Array.isArray(content.careEntries)
    ? (content.careEntries as CareEntry[])
    : [];
  const subjectProgress = Array.isArray(content.subjectProgress)
    ? (content.subjectProgress as SubjectProgress[])
    : [];
  const meals = typeof content.meals === "string" ? content.meals : null;
  const nap = typeof content.nap === "string" ? content.nap : null;
  const concentration = typeof content.concentrationLevel === "string" ? content.concentrationLevel : null;
  const teacherComments =
    typeof content.teacherComments === "string" ? content.teacherComments : null;
  const ageBand = AGE_GROUP_LABEL[report.age_group] ?? report.age_group;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Full Daily Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Detailed report for {student.name} ({ageBand}).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/parent/reports">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Reports
            </Link>
          </Button>
          <PrintButton />
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-montessori-primary" />
            Report Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <SummaryField label="Student" value={student.name} />
            <SummaryField
              label="Date"
              value={new Date(report.report_date).toLocaleDateString("en-NG", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <SummaryField label="Classroom" value={student.classroom ?? "—"} />
            <SummaryField label="Age Band" value={ageBand} />
          </div>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className={statusColor(report.status)}>
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </Badge>
            {report.general_mood && (
              <>
                <span className="text-2xl">{moodEmoji(report.general_mood)}</span>
                <span className="text-sm text-slate-600">{report.general_mood}</span>
              </>
            )}
            {report.week_label && <span className="text-sm text-slate-400">{report.week_label}</span>}
          </div>
        </CardContent>
      </Card>

      {(meals || nap || careEntries.length > 0) && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif text-slate-900">Care Routine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {meals && <FieldBlock label="Meals" value={meals} />}
            {nap && <FieldBlock label="Nap" value={nap} />}
            {careEntries.map((entry, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    {entry.label}
                  </p>
                  {entry.time && (
                    <span className="text-xs text-slate-400">{entry.time}</span>
                  )}
                </div>
                {entry.value && (
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {entry.value}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {subjectProgress.length > 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif text-slate-900">
              Subject Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subjectProgress.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.subject}
                  </p>
                  {item.activity && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-white border-slate-200 text-slate-700"
                    >
                      {item.activity}
                    </Badge>
                  )}
                </div>
                {item.note && (
                  <p className="text-sm text-slate-700 mt-1">{item.note}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {workCycle.length > 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif text-slate-900">Work Cycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workCycle.map((work, index) => (
              <div key={index} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{work.area}</p>
                  {work.level && (
                    <Badge variant="outline" className="text-xs bg-white border-slate-200 text-slate-700">
                      {work.level}
                    </Badge>
                  )}
                </div>
                {work.activity && <p className="text-sm text-slate-700 mt-1">{work.activity}</p>}
              </div>
            ))}
            {concentration && (
              <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Concentration</p>
                <p className="text-sm text-slate-800 mt-1">{concentration}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-montessori-primary" />
            Teacher Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-800">{teacherComments || "—"}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
      <p className="text-sm font-medium text-slate-900 mt-1">{value}</p>
    </div>
  );
}
