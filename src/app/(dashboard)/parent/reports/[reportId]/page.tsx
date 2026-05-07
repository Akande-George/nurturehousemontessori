"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import {
  getDailyReportById,
  getRoleUser,
  getStudentById,
  getStudentsForParent,
  useDemoStore,
} from "@/lib/mock/demo-store";

function getDisplayAgeBand(ageGroup: string) {
  if (ageGroup === "0-2 years") return "0-3 years";
  if (ageGroup === "7-9 years") return "6-9 years";
  return ageGroup;
}

function moodEmoji(mood: string) {
  if (mood === "Happy") return "😊";
  if (mood === "Sad") return "😢";
  return "😐";
}

function statusColor(status: string) {
  if (status === "sent")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "generated") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "pending")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function ParentReportDetailsPage() {
  useDemoStore();
  const params = useParams<{ reportId: string }>();
  const reportId = decodeURIComponent(params.reportId ?? "");

  const parent = getRoleUser("parent");
  const parentStudentIds = new Set(
    getStudentsForParent(parent.id).map((s) => s.id),
  );

  const report = getDailyReportById(reportId);
  const student = report ? getStudentById(report.studentId) : null;

  const isAccessible =
    !!report && !!student && parentStudentIds.has(report.studentId);

  if (!isAccessible) {
    return (
      <div className="max-w-3xl mx-auto pb-20">
        <Card className="border-dashed border-slate-200 shadow-none mt-10">
          <CardContent className="py-14 text-center">
            <p className="text-base font-medium text-slate-800">
              Report not found
            </p>
            <p className="text-sm text-slate-500 mt-1">
              The report link may be invalid, or this report is not assigned to
              your child.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/parent/reports">Back to Daily Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">
            Full Daily Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Detailed report for {student.name} (
            {getDisplayAgeBand(report.ageGroup)}).
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/parent/reports">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
        </Button>
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
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                Student
              </p>
              <p className="font-medium text-slate-900">{student.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                Date
              </p>
              <p className="font-medium text-slate-900">
                {new Date(report.date).toLocaleDateString("en-NG", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                Classroom
              </p>
              <p className="font-medium text-slate-900">{student.classroom}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                Age Band
              </p>
              <p className="font-medium text-slate-900">
                {getDisplayAgeBand(report.ageGroup)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Badge variant="outline" className={statusColor(report.status)}>
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </Badge>
            <span className="text-2xl">{moodEmoji(report.generalMood)}</span>
            <span className="text-sm text-slate-600">{report.generalMood}</span>
          </div>
        </CardContent>
      </Card>

      {report.careEntries && report.careEntries.length > 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif text-slate-900">
              Care Entries (0-3 Years)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.careEntries.map((entry, index) => (
              <div
                key={`${entry.label}-${index}`}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  {entry.label}
                </p>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  {entry.value}
                </p>
              </div>
            ))}

            {report.funLearning && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">
                  Fun Learning
                </p>
                <p className="text-sm text-emerald-900 mt-1">
                  {report.funLearning}
                </p>
              </div>
            )}

            {report.followUpAtHome && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold">
                  Follow Up At Home
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  {report.followUpAtHome}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {report.workCycle && report.workCycle.length > 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif text-slate-900">
              Work Cycle (3-6 Years)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.workCycle.map((work, index) => (
              <div
                key={`${work.area}-${index}`}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {work.area}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs bg-white border-slate-200 text-slate-700"
                  >
                    {work.level}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 mt-1">{work.activity}</p>
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {report.concentrationLevel && (
                <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    Concentration
                  </p>
                  <p className="text-sm text-slate-800 mt-1">
                    {report.concentrationLevel}
                  </p>
                </div>
              )}
              {report.socialDevelopment && (
                <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    Social Development
                  </p>
                  <p className="text-sm text-slate-800 mt-1">
                    {report.socialDevelopment}
                  </p>
                </div>
              )}
              {report.independenceSkills && (
                <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    Independence Skills
                  </p>
                  <p className="text-sm text-slate-800 mt-1">
                    {report.independenceSkills}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {report.subjectProgress && report.subjectProgress.length > 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif text-slate-900">
              Subject Progress (6-9 Years)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.subjectProgress.map((subject, index) => (
              <div
                key={`${subject.subject}-${index}`}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {subject.subject}
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  {subject.activity}
                </p>
                <p className="text-xs text-slate-500 mt-1 italic">
                  {subject.note}
                </p>
              </div>
            ))}

            {report.projectWork && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">
                  Project Work
                </p>
                <p className="text-sm text-indigo-900 mt-1">
                  {report.projectWork}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-montessori-primary" />
            Comments & Signatures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Teacher Comment
            </p>
            <p className="text-sm text-slate-800">{report.teacherComments}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Parent Comment
            </p>
            <p className="text-sm text-slate-800">
              {report.parentComments || "(No comments yet)"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Teacher Signature
              </p>
              <p className="text-sm text-slate-900 mt-1">
                {report.teacherSignature}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Parent Signature
              </p>
              <p className="text-sm text-slate-900 mt-1">
                {report.parentSignature || "Pending"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
