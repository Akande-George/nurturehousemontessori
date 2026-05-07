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

  const handleDownloadReport = (report: DemoDailyReport) => {
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Daily Report - ${report.date}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0; padding: 20px; color: #333; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { margin: 0; font-size: 24px; }
    .school { color: #666; font-size: 12px; margin-top: 5px; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; padding: 15px; background: #f9fafb; border-radius: 8px; }
    .info-row { }
    .label { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #666; }
    .value { font-size: 14px; margin-top: 5px; }
    .section { margin-bottom: 30px; }
    .section-title { font-weight: bold; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; }
    .content-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .content-label { font-weight: 500; }
    .mood { font-size: 32px; margin: 10px 0; }
    .signature-section { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .signature-line { border-top: 1px solid #333; padding-top: 10px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>DAILY REPORT</h1>
    <div class="school">Nurture House Montessori, Ilorin, Nigeria</div>
  </div>

  <div class="student-info">
    <div class="info-row">
      <div class="label">Student</div>
      <div class="value">${selectedChild?.name}</div>
    </div>
    <div class="info-row">
      <div class="label">Date</div>
      <div class="value">${new Date(report.date).toLocaleDateString("en-NG", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}</div>
    </div>
    <div class="info-row">
      <div class="label">Classroom</div>
      <div class="value">${selectedChild?.classroom}</div>
    </div>
    <div class="info-row">
      <div class="label">Age Group</div>
      <div class="value">${getDisplayAgeBand(report.ageGroup)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">General Mood</div>
    <div class="mood">${moodEmoji(report.generalMood)}</div>
    <p>${report.generalMood}</p>
  </div>

  ${
    report.careEntries
      ? `
  <div class="section">
    <div class="section-title">Care Entries (0-3 Years)</div>
    ${report.careEntries
      .map(
        (entry: DemoDailyCareEntry) => `
      <div class="content-row">
        <span class="content-label">${entry.label}</span>
        <span>${entry.value}</span>
      </div>
    `,
      )
      .join("")}
    <div style="margin-top: 15px;">
      <strong>Fun Learning:</strong>
      <p>${report.funLearning}</p>
    </div>
    <div>
      <strong>Follow Up at Home:</strong>
      <p>${report.followUpAtHome}</p>
    </div>
  </div>
  `
      : ""
  }

  ${
    report.workCycle
      ? `
  <div class="section">
    <div class="section-title">Work Cycle (3-6 Years)</div>
    ${report.workCycle
      .map(
        (work: DemoWorkEntry) => `
      <div class="content-row">
        <span><strong>${work.area}</strong> — ${work.activity}</span>
        <span>${work.level}</span>
      </div>
    `,
      )
      .join("")}
    ${report.concentrationLevel ? `<p><strong>Concentration:</strong> ${report.concentrationLevel}</p>` : ""}
    ${report.socialDevelopment ? `<p><strong>Social:</strong> ${report.socialDevelopment}</p>` : ""}
    ${report.independenceSkills ? `<p><strong>Independence:</strong> ${report.independenceSkills}</p>` : ""}
  </div>
  `
      : ""
  }

  ${
    report.subjectProgress
      ? `
  <div class="section">
    <div class="section-title">Subject Progress (6-9 Years)</div>
    ${report.subjectProgress
      .map(
        (subj: DemoSubjectEntry) => `
      <div style="margin-bottom: 15px; padding: 10px; background: #f9fafb; border-radius: 4px;">
        <strong>${subj.subject}</strong>
        <p>${subj.activity}</p>
        <small><em>${subj.note}</em></small>
      </div>
    `,
      )
      .join("")}
    ${report.projectWork ? `<p><strong>Project Work:</strong> ${report.projectWork}</p>` : ""}
  </div>
  `
      : ""
  }

  <div class="section">
    <div class="section-title">Teacher Comments</div>
    <p>${report.teacherComments}</p>
  </div>

  <div class="section">
    <div class="section-title">Parent Comments</div>
    <p>${report.parentComments || "(No comments yet)"}</p>
  </div>

  <div class="signature-section">
    <div>
      <p><strong>Teacher:</strong></p>
      <p>${report.teacherSignature}</p>
      <div class="signature-line">Signature</div>
    </div>
    <div>
      <p><strong>Parent:</strong></p>
      <p>${report.parentSignature || "Pending"}</p>
      <div class="signature-line">Signature</div>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([reportHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Report-${selectedChild?.name.replace(/\s+/g, "-")}-${report.date}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
