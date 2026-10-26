"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  deleteConferenceReport,
  generateConferenceReport,
} from "@/lib/actions/conference";
import {
  DEFAULT_PERIOD_DAYS,
  DEFAULT_SECTIONS,
  REPORT_KINDS,
  REPORT_KIND_BLURB,
  REPORT_KIND_LABELS,
  REPORT_KIND_SHORT,
  SECTION_LABELS,
  TERM_LABELS,
  academicYearFor,
  formatReportDate,
  type ConferenceSections,
  type ReportKind,
} from "@/lib/montessori/conference";
import type { ConferenceReportStatus, Term } from "@/lib/db/types";

type ReportLite = {
  id: string;
  studentName: string;
  title: string;
  reportType: ReportKind;
  term: Term;
  academicYear: string;
  periodStart: string;
  periodEnd: string;
  status: ConferenceReportStatus;
  updatedAt: string;
  /** The family's reply, written after the report was published. */
  parentComment: string | null;
  parentCommentAt: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Default the marking period to a whole term for the end-of-term report and
 * roughly its first half for the mid-term one, both ending today.
 */
function defaultStart(kind: ReportKind): string {
  const d = new Date();
  d.setDate(d.getDate() - DEFAULT_PERIOD_DAYS[kind]);
  return d.toISOString().slice(0, 10);
}

/** The date 14 days ago — anything before it counts as a stale period end. */
function staleThreshold(): string {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return d.toISOString().slice(0, 10);
}

export function ProgressReportsListClient({
  students,
  reports,
}: {
  students: { id: string; name: string }[];
  reports: ReportLite[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [reportType, setReportType] = useState<ReportKind>("termly");
  const [term, setTerm] = useState<Term>("first");
  const [academicYear, setAcademicYear] = useState(() => academicYearFor());
  const [periodStart, setPeriodStart] = useState(() => defaultStart("termly"));
  const [periodEnd, setPeriodEnd] = useState(today);
  const [sections, setSections] = useState<ConferenceSections>(DEFAULT_SECTIONS);

  // Switching the kind re-suggests the window, since a mid-term report covers
  // about half of what an end-of-term one does. The teacher can still edit it.
  const chooseKind = (kind: ReportKind) => {
    setReportType(kind);
    setPeriodStart(defaultStart(kind));
    setPeriodEnd(today());
  };

  // A family's reply mails the guide who wrote the report, and that mail links
  // here — so this list is where they arrive looking for it.
  const replied = reports.filter((r) => r.parentComment);

  // Lesson levels are recorded as "current status", not history — so a period
  // ending well in the past prints today's levels. Warn rather than block.
  const [staleBefore] = useState(staleThreshold);
  const staleEnd = periodEnd < staleBefore;

  const handleGenerate = () => {
    if (!studentId) {
      toast({ title: "Pick a child first", variant: "destructive" });
      return;
    }
    if (periodEnd < periodStart) {
      toast({
        title: "Check the dates",
        description: "The period end must fall on or after the start.",
        variant: "destructive",
      });
      return;
    }
    start(async () => {
      const res = await generateConferenceReport({
        studentId,
        reportType,
        term,
        academicYear: academicYear.trim(),
        periodStart,
        periodEnd,
        sections,
      });
      if (res.ok && res.id) {
        setOpen(false);
        router.push(`/teacher/reports/progress/${res.id}`);
      } else {
        toast({
          title: res.error ?? "Could not generate the report",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (r: ReportLite) => {
    if (!window.confirm(`Delete the draft report for ${r.studentName}? This can't be undone.`)) return;
    start(async () => {
      const res = await deleteConferenceReport(r.id);
      if (res.ok) {
        toast({ title: "Report deleted" });
        router.refresh();
      } else {
        toast({ title: res.error ?? "Could not delete", variant: "destructive" });
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl text-slate-900">Progress Reports</h1>
          <p className="text-sm text-slate-500">
            Generate a child&apos;s mid-term or end-of-term report — everything
            recorded for them over the period — write your commentary, then
            publish it to their parents.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={students.length === 0}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> New report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New {REPORT_KIND_LABELS[reportType].toLowerCase()}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Kind of report
                </label>
                <div className="flex gap-2">
                  {REPORT_KINDS.map((kind) => (
                    <Button
                      key={kind}
                      type="button"
                      variant={reportType === kind ? "default" : "outline"}
                      onClick={() => chooseKind(kind)}
                      className={`flex-1 ${
                        reportType === kind
                          ? "bg-montessori-primary text-white hover:bg-montessori-primary/90"
                          : "text-slate-600"
                      }`}
                    >
                      {REPORT_KIND_LABELS[kind]}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  {REPORT_KIND_BLURB[reportType]}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Child</label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger className="border-slate-200 bg-white">
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Term</label>
                  <Select
                    value={term}
                    onValueChange={(v) => setTerm(v as Term)}
                  >
                    <SelectTrigger className="border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TERM_LABELS) as Term[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {TERM_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Academic year
                  </label>
                  <Input
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. 2025-2026"
                    className="border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Marking period starts
                  </label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Marking period ends
                  </label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="border-slate-200"
                  />
                </div>
              </div>

              {staleEnd && (
                <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Lesson levels reflect where each child is <em>today</em>, not
                  where they were at the end of this period. For a past period,
                  levels may read higher than they were at the time.
                </p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Sections to include
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SECTION_LABELS.map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
                    >
                      <Checkbox
                        checked={sections[key]}
                        onCheckedChange={(v) =>
                          setSections((prev) => ({ ...prev, [key]: v === true }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={pending}
                  className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
                >
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {replied.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-montessori-primary/20 bg-montessori-primary/5 p-3.5">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-montessori-primary" />
          <p className="text-sm text-slate-700">
            <span className="font-semibold">
              {replied.length === 1
                ? "One family has replied"
                : `${replied.length} families have replied`}
            </span>{" "}
            —{" "}
            {replied
              .slice(0, 3)
              .map((r) => r.studentName)
              .join(", ")}
            {replied.length > 3 && ` and ${replied.length - 3} more`}. Open a
            report to read the comment above its signature line.
          </p>
        </div>
      )}

      {students.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">
          No children yet. Add children before writing progress reports.
        </p>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <FileText className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-500">
            No progress reports yet. Generate the first one to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Report</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Marking period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-slate-900">
                    {r.studentName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        r.reportType === "midterm"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }
                    >
                      {REPORT_KIND_SHORT[r.reportType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {TERM_LABELS[r.term]} · {r.academicYear}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-slate-500">
                    {formatReportDate(r.periodStart)} –{" "}
                    {formatReportDate(r.periodEnd)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={
                          r.status === "published"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }
                      >
                        {r.status === "published" ? "Published" : "Draft"}
                      </Badge>
                      {r.parentComment && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-montessori-primary/30 bg-montessori-primary/10 text-montessori-primary"
                          title={
                            r.parentCommentAt
                              ? `Replied ${formatReportDate(r.parentCommentAt)}`
                              : undefined
                          }
                        >
                          <MessageSquare className="h-3 w-3" /> Parent replied
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/teacher/reports/progress/${r.id}`}>
                          {r.status === "published" ? "View" : "Edit"}
                        </Link>
                      </Button>
                      {r.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-slate-500 hover:text-red-600"
                          onClick={() => handleDelete(r)}
                          disabled={pending}
                          aria-label={`Delete report for ${r.studentName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
