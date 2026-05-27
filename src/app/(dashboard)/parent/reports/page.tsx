"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, Download, FileText } from "lucide-react";
import {
  type DemoDailyCareEntry,
  type DemoDailyReport,
  type DemoSubjectEntry,
  type DemoWorkEntry,
  getRoleUser,
  getStudentDailyReports,
  getStudentsForParent,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { downloadStructuredPdf, type PdfTextLine } from "@/lib/pdf/download-pdf";

export default function DailyReportsPage() {
  useDemoStore();
  const parent = getRoleUser("parent");
  const children = getStudentsForParent(parent.id);

  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    children.length > 0 ? children[0].id : null,
  );

  const selectedChild = selectedChildId
    ? children.find((c) => c.id === selectedChildId)
    : null;
  const reports = selectedChild ? getStudentDailyReports(selectedChild.id) : [];

  const moodEmoji = (mood: string) => {
    switch (mood) {
      case "Happy":
        return "😊";
      case "Neutral":
        return "😐";
      case "Sad":
        return "😢";
      default:
        return "😊";
    }
  };

  const getDisplayAgeBand = (ageGroup: string) => {
    if (ageGroup === "0-2 years") return "0-3 years";
    if (ageGroup === "7-9 years") return "6-9 years";
    return ageGroup;
  };

  const handleDownloadReport = async (report: DemoDailyReport) => {
    const lines: PdfTextLine[] = [
      { kind: "title", text: "Daily Report" },
      {
        kind: "subtitle",
        text: new Date(report.date).toLocaleDateString("en-NG", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      },
      { kind: "rule" },
      { kind: "label-value", label: "Student", value: selectedChild?.name ?? "" },
      {
        kind: "label-value",
        label: "Classroom",
        value: selectedChild?.classroom ?? "",
      },
      {
        kind: "label-value",
        label: "Age Group",
        value: getDisplayAgeBand(report.ageGroup),
      },
      {
        kind: "label-value",
        label: "General Mood",
        value: `${moodEmoji(report.generalMood)}  ${report.generalMood}`,
      },
    ];

    if (typeof report.temperatureCelsius === "number") {
      lines.push({
        kind: "label-value",
        label: "Temperature",
        value: `${report.temperatureCelsius.toFixed(1)}°C${
          report.temperatureTakenAt ? ` (taken at ${report.temperatureTakenAt})` : ""
        }`,
      });
    }

    lines.push({ kind: "rule" });

    if (report.careEntries && report.careEntries.length > 0) {
      lines.push({ kind: "heading", text: "Care Routine" });
      lines.push({
        kind: "table",
        headers: ["Entry", "Value"],
        rows: report.careEntries.map((e) => [
          e.label + (e.time ? ` · ${e.time}` : ""),
          e.value,
        ]),
      });
      if (report.funLearning)
        lines.push({ kind: "label-value", label: "Fun Learning", value: report.funLearning });
      if (report.followUpAtHome)
        lines.push({ kind: "label-value", label: "Follow Up at Home", value: report.followUpAtHome });
      lines.push({ kind: "rule" });
    }

    if (report.workCycle && report.workCycle.length > 0) {
      lines.push({ kind: "heading", text: "Work Cycle" });
      lines.push({
        kind: "table",
        headers: ["Area", "Activity", "Level"],
        rows: report.workCycle.map((w) => [w.area, w.activity, w.level]),
      });
      if (report.concentrationLevel)
        lines.push({ kind: "label-value", label: "Concentration", value: report.concentrationLevel });
      if (report.independenceSkills)
        lines.push({ kind: "label-value", label: "Independence", value: report.independenceSkills });
      if (report.socialDevelopment)
        lines.push({ kind: "label-value", label: "Social", value: report.socialDevelopment });
      if (report.mealNotes)
        lines.push({ kind: "label-value", label: "Meal Notes", value: report.mealNotes });
      lines.push({ kind: "rule" });
    }

    if (report.subjectProgress && report.subjectProgress.length > 0) {
      lines.push({ kind: "heading", text: "Subject Progress" });
      lines.push({
        kind: "table",
        headers: ["Subject", "Activity", "Note"],
        rows: report.subjectProgress.map((s) => [s.subject, s.activity, s.note]),
      });
      if (report.projectWork)
        lines.push({ kind: "label-value", label: "Project Work", value: report.projectWork });
      if (report.behaviorNotes)
        lines.push({ kind: "label-value", label: "Behavior", value: report.behaviorNotes });
      lines.push({ kind: "rule" });
    }

    lines.push({ kind: "heading", text: "Teacher Comments" });
    lines.push({ kind: "body", text: report.teacherComments || "—" });
    lines.push({ kind: "spacer" });
    lines.push({ kind: "heading", text: "Parent Comments" });
    lines.push({
      kind: "body",
      text: report.parentComments || "(No comments yet)",
    });
    lines.push({ kind: "rule" });
    lines.push({
      kind: "label-value",
      label: "Teacher Signature",
      value: report.teacherSignature || "Pending",
    });
    lines.push({
      kind: "label-value",
      label: "Parent Signature",
      value: report.parentSignature || "Pending",
    });

    await downloadStructuredPdf({
      filename: `Report-${(selectedChild?.name ?? "child").replace(/\s+/g, "-")}-${report.date}.pdf`,
      header: "Nurture House Montessori · Daily Report",
      footer: `Report generated ${new Date().toLocaleDateString("en-NG")}`,
      lines,
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:space-y-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">Daily Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          View and download daily activity reports for each child.
        </p>
      </div>

      {/* Student selector */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                selectedChildId === child.id
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full ${child.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}
              >
                {child.name[0]}
              </div>
              {child.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {selectedChild && (
        <>
          {reports.length === 0 ? (
            <Card className="border-dashed border-slate-200 shadow-none">
              <CardContent className="py-16 text-center text-sm text-slate-500">
                No daily reports available yet for {selectedChild.name}.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <p className="font-semibold text-slate-900">
                              {new Date(report.date).toLocaleDateString(
                                "en-NG",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${
                              report.status === "sent"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : report.status === "generated"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {report.status.charAt(0).toUpperCase() +
                              report.status.slice(1)}
                          </Badge>
                          <span className="text-2xl">
                            {moodEmoji(report.generalMood)}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          {report.careEntries &&
                            report.careEntries.length > 0 && (
                              <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                                  Care & Learning
                                </p>
                                <ul className="text-xs space-y-0.5">
                                  {report.careEntries
                                    .slice(0, 2)
                                    .map(
                                      (
                                        entry: DemoDailyCareEntry,
                                        i: number,
                                      ) => (
                                        <li key={i} className="text-slate-700">
                                          {entry.label}:{" "}
                                          <strong>{entry.value}</strong>
                                        </li>
                                      ),
                                    )}
                                </ul>
                                {report.funLearning && (
                                  <p className="text-slate-600 italic mt-2">
                                    &ldquo;{report.funLearning}&rdquo;
                                  </p>
                                )}
                              </div>
                            )}

                          {report.workCycle && report.workCycle.length > 0 && (
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                                Work Areas
                              </p>
                              <ul className="text-xs space-y-0.5">
                                {report.workCycle
                                  .slice(0, 2)
                                  .map((work: DemoWorkEntry, i: number) => (
                                    <li key={i} className="text-slate-700">
                                      {work.area}:{" "}
                                      <strong>{work.activity}</strong> (
                                      {work.level})
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                          {report.subjectProgress &&
                            report.subjectProgress.length > 0 && (
                              <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                                  Subject Progress
                                </p>
                                <ul className="text-xs space-y-0.5">
                                  {report.subjectProgress
                                    .slice(0, 2)
                                    .map(
                                      (subj: DemoSubjectEntry, i: number) => (
                                        <li key={i} className="text-slate-700">
                                          {subj.subject}:{" "}
                                          <strong>{subj.activity}</strong>
                                        </li>
                                      ),
                                    )}
                                </ul>
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 shrink-0 sm:flex-row md:w-auto md:flex-col">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 bg-white border-slate-200 sm:flex-1 md:w-auto"
                        >
                          <Link href={`/parent/reports/${report.id}`}>
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Full</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        <button
                          onClick={() => handleDownloadReport(report)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-montessori-primary/30 px-3 py-2 text-xs font-medium text-montessori-primary transition-colors hover:bg-montessori-primary/5 sm:flex-1 md:w-auto"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
