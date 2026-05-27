"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DemoDailyMood,
  DemoDailyReportStatus,
  formatDateTime,
  getDemoSnapshot,
  getDailyReportById,
  getDailyReports,
  updateDailyReportStatus,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { Calendar, Clock, FileDown, Printer, Send } from "lucide-react";
import { downloadStructuredPdf } from "@/lib/pdf/download-pdf";

type AgeGroup = "0-2 years" | "3-6 years" | "7-9 years";

const AGE_GROUPS: { key: AgeGroup; label: string; description: string }[] = [
  {
    key: "0-2 years",
    label: "Infant Community",
    description:
      "Infant Community daily sheet — mood, care routine, fun learning, home follow-up, and signatures.",
  },
  {
    key: "3-6 years",
    label: "Children's House",
    description:
      "Children's House daily sheet — Montessori work cycle, concentration, independence, social development, and meal notes.",
  },
  {
    key: "7-9 years",
    label: "7–9 Years",
    description:
      "Extended work-cycle daily sheet — subject progress, project work, behaviour notes, and teacher feedback.",
  },
];

const statusTone: Record<DemoDailyReportStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  generated: "bg-emerald-100 text-emerald-700",
  sent: "bg-sky-100 text-sky-700",
};

const moodTone: Record<DemoDailyMood, string> = {
  Happy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Neutral: "bg-amber-100 text-amber-700 border-amber-200",
  Sad: "bg-rose-100 text-rose-700 border-rose-200",
};

const levelTone: Record<string, string> = {
  Introduced: "bg-amber-50 text-amber-700 border-amber-200",
  Practicing: "bg-sky-50 text-sky-700 border-sky-200",
  Mastered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function ReportsPage() {
  const snapshot = useDemoStore();
  const { toast } = useToast();

  const [activeAgeGroup, setActiveAgeGroup] = useState<AgeGroup>("0-2 years");
  const [activeTab, setActiveTab] = useState<DemoDailyReportStatus>("pending");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{
    mode: "single" | "all";
    reportId?: string;
  }>({ mode: "all" });
  const [teacherNote, setTeacherNote] = useState("");

  const allReports = getDailyReports();
  const groupReports = allReports.filter((r) => r.ageGroup === activeAgeGroup);
  const visibleReports = groupReports.filter((r) => r.status === activeTab);
  const pendingCount = groupReports.filter(
    (r) => r.status === "pending",
  ).length;
  const generatedCount = groupReports.filter(
    (r) => r.status === "generated",
  ).length;
  const sentCount = groupReports.filter((r) => r.status === "sent").length;

  useEffect(() => {
    setSelectedReportId("");
    setActiveTab("pending");
  }, [activeAgeGroup]);

  useEffect(() => {
    if (!visibleReports.length) {
      setSelectedReportId("");
      return;
    }
    if (!visibleReports.some((r) => r.id === selectedReportId)) {
      setSelectedReportId(visibleReports[0].id);
    }
  }, [selectedReportId, visibleReports]);

  const selectedReport =
    visibleReports.find((r) => r.id === selectedReportId) ??
    (selectedReportId ? getDailyReportById(selectedReportId) : undefined) ??
    visibleReports[0];

  const selectedStudent = selectedReport
    ? snapshot.students.find((s) => s.id === selectedReport.studentId)
    : undefined;

  const openGenerateDialog = (reportId?: string) => {
    const report = reportId ? getDailyReportById(reportId) : undefined;
    setSelectedTarget(
      reportId ? { mode: "single", reportId } : { mode: "all" },
    );
    setTeacherNote(report?.teacherComments ?? "");
    if (reportId) setSelectedReportId(reportId);
    setIsGenerateOpen(true);
  };

  const getTargetLabel = () => {
    if (selectedTarget.mode === "all") {
      return `${pendingCount} ${activeAgeGroup} report${pendingCount === 1 ? "" : "s"}`;
    }
    const report = selectedTarget.reportId
      ? getDailyReportById(selectedTarget.reportId)
      : undefined;
    const student = report
      ? snapshot.students.find((s) => s.id === report.studentId)
      : undefined;
    return student?.name ?? "selected child";
  };

  const handleGenerate = () => {
    const targetIds =
      selectedTarget.mode === "all"
        ? groupReports.filter((r) => r.status === "pending").map((r) => r.id)
        : selectedTarget.reportId
          ? [selectedTarget.reportId]
          : [];

    targetIds.forEach((id) => updateDailyReportStatus(id, "generated"));

    toast({
      title: `${activeAgeGroup} report prepared`,
      description:
        targetIds.length === 1
          ? `${getTargetLabel()}'s report is ready for family sharing.`
          : `${targetIds.length} reports are now ready for review.`,
    });
    setIsGenerateOpen(false);
  };

  const handleShare = (reportId: string, studentName: string) => {
    updateDailyReportStatus(reportId, "sent");
    toast({
      title: "Report shared with parent",
      description: `${studentName}'s ${activeAgeGroup} daily report has been marked as sent.`,
    });
  };

  const handlePrint = async () => {
    const snapshot = getDemoSnapshot();
    const rows = groupReports.map((report) => {
      const student = snapshot.students.find((s) => s.id === report.studentId);
      return [
        student?.name ?? report.studentId,
        report.date,
        report.status,
        report.generalMood,
        typeof report.temperatureCelsius === "number"
          ? `${report.temperatureCelsius.toFixed(1)}°C`
          : "—",
      ];
    });

    await downloadStructuredPdf({
      filename: `daily-reports-${activeAgeGroup.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`,
      header: "Nurture House Montessori · Daily Reports Summary",
      footer: `Exported ${new Date().toLocaleDateString("en-NG")}`,
      lines: [
        { kind: "title", text: `${activeAgeGroup} Daily Reports` },
        { kind: "subtitle", text: `Generated ${new Date().toLocaleDateString("en-NG")}` },
        { kind: "rule" },
        {
          kind: "table",
          headers: ["Student", "Date", "Status", "Mood", "Temp"],
          rows,
        },
      ],
    });

    toast({
      title: "Report exported",
      description: `${activeAgeGroup} summary downloaded as PDF.`,
    });
  };

  const activeGroup = AGE_GROUPS.find((g) => g.key === activeAgeGroup)!;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            Daily Reports
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Nurture House Montessori — daily feedback forms for all three age
            programmes.
          </p>
        </div>
        <Button
          onClick={() => openGenerateDialog()}
          disabled={pendingCount === 0}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
        >
          <FileDown className="w-4 h-4" /> Prepare Pending ({pendingCount})
        </Button>
      </div>

      {/* Age-group selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {AGE_GROUPS.map((group) => {
          const count = allReports.filter(
            (r) => r.ageGroup === group.key,
          ).length;
          const isActive = activeAgeGroup === group.key;
          return (
            <button
              key={group.key}
              onClick={() => setActiveAgeGroup(group.key)}
              className={`text-left rounded-2xl border p-5 transition-all ${
                isActive
                  ? "border-montessori-primary bg-montessori-primary/5 shadow-sm ring-1 ring-montessori-primary/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-lg font-serif ${isActive ? "text-montessori-primary" : "text-slate-900"}`}
                >
                  {group.label}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? "bg-montessori-primary/15 text-montessori-primary" : "bg-slate-100 text-slate-500"}`}
                >
                  {count} total
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {group.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      <Card className="border-slate-100 shadow-sm bg-gradient-to-r from-montessori-primary/10 via-white to-montessori-secondary/10">
        <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-montessori-primary/15 text-montessori-primary flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">
                Active programme
              </p>
              <h2 className="text-xl font-serif text-slate-900">
                {activeGroup.label} Daily Reports
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {activeGroup.description}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-center">
              <p className="text-3xl font-serif text-slate-900">
                {pendingCount}
              </p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Pending
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-center">
              <p className="text-3xl font-serif text-emerald-600">
                {generatedCount}
              </p>
              <p className="text-xs font-medium text-emerald-700/80 uppercase tracking-widest">
                Prepared
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-center">
              <p className="text-3xl font-serif text-sky-700">{sentCount}</p>
              <p className="text-xs font-medium text-sky-700/80 uppercase tracking-widest">
                Shared
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report list + detail */}
      <div className="space-y-6">
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-4 text-sm font-medium">
              {(
                [
                  ["pending", pendingCount],
                  ["generated", generatedCount],
                  ["sent", sentCount],
                ] as Array<[DemoDailyReportStatus, number]>
              ).map(([tab, count]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-1 border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? "border-montessori-primary text-montessori-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab} ({count})
                </button>
              ))}
            </div>
            {activeTab === "generated" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  visibleReports.forEach((r) => {
                    const student = snapshot.students.find(
                      (s) => s.id === r.studentId,
                    );
                    handleShare(r.id, student?.name ?? "Student");
                  });
                }}
                className="h-8 text-xs font-medium gap-1.5 hidden sm:flex"
              >
                <Send className="w-3.5 h-3.5" /> Share All Prepared
              </Button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-transparent">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                    Child
                  </TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                    Class
                  </TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                    Mood
                  </TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                    Last Updated
                  </TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                    Status
                  </TableHead>
                  <TableHead className="font-medium text-right text-xs uppercase tracking-wider text-slate-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleReports.map((report) => {
                  const student = snapshot.students.find(
                    (s) => s.id === report.studentId,
                  );
                  const isSelected = selectedReport?.id === report.id;
                  return (
                    <TableRow
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-montessori-primary/5" : "hover:bg-slate-50"}`}
                    >
                      <TableCell className="font-medium text-slate-900">
                        {student?.name ?? "Unknown child"}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {student?.classroom ?? "Unknown class"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={moodTone[report.generalMood]}
                        >
                          {report.generalMood}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />{" "}
                          {formatDateTime(report.updatedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${statusTone[report.status]} font-medium border-none capitalize`}
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {report.status === "pending" ? (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openGenerateDialog(report.id);
                              }}
                              className="bg-slate-900 text-white hover:bg-slate-800 h-8 text-xs"
                            >
                              Prepare
                            </Button>
                          ) : report.status === "generated" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReportId(report.id);
                                }}
                                className="h-8 text-xs font-medium bg-white"
                              >
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(
                                    report.id,
                                    student?.name ?? "Student",
                                  );
                                }}
                                className="h-8 text-xs bg-montessori-primary text-white hover:bg-montessori-primary/90"
                              >
                                Share
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrint();
                              }}
                              className="h-8 w-8 text-slate-400 hover:text-slate-600"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {visibleReports.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-sm text-slate-500"
                    >
                      No {activeAgeGroup} reports in this stage right now.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Report detail */}
        {selectedReport && selectedStudent ? (
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/40">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-serif text-slate-900">
                    {selectedStudent.name}&apos;s {activeGroup.label} Daily
                    Report
                  </CardTitle>
                  <CardDescription>
                    {selectedStudent.classroom} · {selectedReport.date} ·{" "}
                    {selectedReport.weekLabel}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={moodTone[selectedReport.generalMood]}
                  >
                    {selectedReport.generalMood}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`${statusTone[selectedReport.status]} font-medium border-none capitalize`}
                  >
                    {selectedReport.status}
                  </Badge>
                  {typeof selectedReport.temperatureCelsius === "number" && (
                    <Badge
                      variant="outline"
                      className={
                        selectedReport.temperatureCelsius >= 38
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : selectedReport.temperatureCelsius >= 37.5
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : selectedReport.temperatureCelsius < 36
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    >
                      🌡 {selectedReport.temperatureCelsius.toFixed(1)}°C
                      {selectedReport.temperatureTakenAt
                        ? ` · ${selectedReport.temperatureTakenAt}`
                        : ""}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* ── 0-2 YEARS ── */}
              {activeAgeGroup === "0-2 years" && (
                <>
                  {selectedReport.careEntries?.length ? (
                    <section className="rounded-2xl border border-slate-100 p-5 bg-white">
                      <h3 className="font-medium text-slate-900 mb-3">
                        Care Routine
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedReport.careEntries.map((entry) => (
                          <div
                            key={entry.label}
                            className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                          >
                            <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">
                              {entry.label}
                            </p>
                            <p className="text-sm font-medium text-slate-900">
                              {entry.value}
                            </p>
                            {entry.time ? (
                              <p className="text-xs text-slate-500 mt-1">
                                Time: {entry.time}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {selectedReport.funLearning ? (
                      <section className="rounded-2xl border border-slate-100 p-5 bg-white">
                        <h3 className="font-medium text-slate-900 mb-2">
                          Today I Had Fun Learning
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {selectedReport.funLearning}
                        </p>
                      </section>
                    ) : null}
                    {selectedReport.followUpAtHome ? (
                      <section className="rounded-2xl border border-slate-100 p-5 bg-white">
                        <h3 className="font-medium text-slate-900 mb-2">
                          Follow Up at Home
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {selectedReport.followUpAtHome}
                        </p>
                      </section>
                    ) : null}
                  </div>
                </>
              )}

              {/* ── 3-6 YEARS ── */}
              {activeAgeGroup === "3-6 years" && (
                <>
                  {selectedReport.workCycle?.length ? (
                    <section className="rounded-2xl border border-slate-100 p-5 bg-white">
                      <h3 className="font-medium text-slate-900 mb-3">
                        Montessori Work Cycle
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedReport.workCycle.map((entry) => (
                          <div
                            key={entry.area}
                            className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                                {entry.area}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-xs ${levelTone[entry.level] ?? ""}`}
                              >
                                {entry.level}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-900">
                              {entry.activity}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    {selectedReport.concentrationLevel ? (
                      <section className="rounded-2xl border border-slate-100 p-4 bg-white">
                        <h3 className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">
                          Concentration
                        </h3>
                        <p className="text-sm text-slate-700">
                          {selectedReport.concentrationLevel}
                        </p>
                      </section>
                    ) : null}
                    {selectedReport.independenceSkills ? (
                      <section className="rounded-2xl border border-slate-100 p-4 bg-white">
                        <h3 className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">
                          Independence
                        </h3>
                        <p className="text-sm text-slate-700">
                          {selectedReport.independenceSkills}
                        </p>
                      </section>
                    ) : null}
                    {selectedReport.socialDevelopment ? (
                      <section className="rounded-2xl border border-slate-100 p-4 bg-white">
                        <h3 className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">
                          Social
                        </h3>
                        <p className="text-sm text-slate-700">
                          {selectedReport.socialDevelopment}
                        </p>
                      </section>
                    ) : null}
                  </div>

                  {selectedReport.mealNotes ? (
                    <section className="rounded-2xl border border-slate-100 p-4 bg-white">
                      <h3 className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">
                        Meal Notes
                      </h3>
                      <p className="text-sm text-slate-700">
                        {selectedReport.mealNotes}
                      </p>
                    </section>
                  ) : null}
                </>
              )}

              {/* ── 7-9 YEARS ── */}
              {activeAgeGroup === "7-9 years" && (
                <>
                  {selectedReport.subjectProgress?.length ? (
                    <section className="rounded-2xl border border-slate-100 p-5 bg-white">
                      <h3 className="font-medium text-slate-900 mb-3">
                        Subject Progress
                      </h3>
                      <div className="space-y-3">
                        {selectedReport.subjectProgress.map((entry) => (
                          <div
                            key={entry.subject}
                            className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                          >
                            <div className="flex items-start gap-3">
                              <Badge
                                variant="outline"
                                className="text-xs bg-white border-slate-200 text-slate-600 shrink-0 mt-0.5"
                              >
                                {entry.subject}
                              </Badge>
                              <div>
                                <p className="text-sm font-medium text-slate-900 mb-1">
                                  {entry.activity}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {entry.note}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {selectedReport.projectWork ? (
                      <section className="rounded-2xl border border-slate-100 p-5 bg-white">
                        <h3 className="font-medium text-slate-900 mb-2">
                          Project Work
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {selectedReport.projectWork}
                        </p>
                      </section>
                    ) : null}
                    {selectedReport.behaviorNotes ? (
                      <section className="rounded-2xl border border-slate-100 p-5 bg-white">
                        <h3 className="font-medium text-slate-900 mb-2">
                          Behaviour Notes
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {selectedReport.behaviorNotes}
                        </p>
                      </section>
                    ) : null}
                  </div>
                </>
              )}

              {/* Shared — comments */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="rounded-2xl border border-slate-100 p-5 bg-montessori-primary/5">
                  <h3 className="font-medium text-slate-900 mb-2">
                    Teacher&apos;s Comments
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedReport.teacherComments ||
                      "No teacher comment added yet."}
                  </p>
                </section>
                <section className="rounded-2xl border border-slate-100 p-5 bg-slate-50/80">
                  <h3 className="font-medium text-slate-900 mb-2">
                    Parent&apos;s Comments
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedReport.parentComments ||
                      "No parent comment has been added yet."}
                  </p>
                </section>
              </div>

              {/* Shared — signatures */}
              <section className="rounded-2xl border border-slate-100 p-5 bg-white">
                <h3 className="font-medium text-slate-900 mb-4">Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">
                      Teacher&apos;s Signature
                    </p>
                    <div className="border-b border-slate-300 pb-2 text-sm text-slate-800">
                      {selectedReport.teacherSignature}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">
                      Parent&apos;s Signature
                    </p>
                    <div className="border-b border-slate-300 pb-2 text-sm text-slate-800">
                      {selectedReport.parentSignature || "Pending"}
                    </div>
                  </div>
                </div>
              </section>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Generate dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Prepare {activeGroup.label} Daily Report</DialogTitle>
            <DialogDescription>
              Configure the daily report for {getTargetLabel()}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-5">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 leading-relaxed">
              {activeAgeGroup === "0-2 years" &&
                "Includes general mood, care routine (food, toilet, nap), fun learning, follow-up at home, and signatures."}
              {activeAgeGroup === "3-6 years" &&
                "Includes general mood, Montessori work cycle, concentration & independence notes, social development, meal notes, and signatures."}
              {activeAgeGroup === "7-9 years" &&
                "Includes general mood, subject progress across curriculum areas, project work, behaviour notes, teacher & parent comments, and signatures."}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">
                Teacher&apos;s Comments
              </label>
              <Textarea
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                className="min-h-[120px] border-slate-200 focus-visible:ring-montessori-primary"
                placeholder={`Add teacher comments for the ${activeGroup.label} daily report.`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2"
            >
              <FileDown className="w-4 h-4" /> Prepare Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
