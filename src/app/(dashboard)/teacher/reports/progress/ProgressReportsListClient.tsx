"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, Plus, AlertTriangle } from "lucide-react";
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
import { generateConferenceReport } from "@/lib/actions/conference";
import {
  DEFAULT_SECTIONS,
  SECTION_LABELS,
  TERM_LABELS,
  formatReportDate,
  type ConferenceSections,
} from "@/lib/montessori/conference";
import { CURRENT_ACADEMIC_YEAR } from "@/lib/db/types";
import type { ConferenceReportStatus, Term } from "@/lib/db/types";

type ReportLite = {
  id: string;
  studentName: string;
  title: string;
  term: Term;
  academicYear: string;
  periodStart: string;
  periodEnd: string;
  status: ConferenceReportStatus;
  updatedAt: string;
};

const today = () => new Date().toISOString().slice(0, 10);

/** Default the marking period to the last ~10 weeks, ending today. */
function defaultStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - 70);
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
  const [term, setTerm] = useState<Term>("first");
  const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR);
  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [sections, setSections] = useState<ConferenceSections>(DEFAULT_SECTIONS);

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

  return (
    <div className="mx-auto max-w-5xl space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl text-slate-900">Progress Reports</h1>
          <p className="text-sm text-slate-500">
            Generate a child&apos;s termly report, write your commentary, then
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
              <DialogTitle>New progress report</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
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
                  <TableCell className="text-slate-600">
                    {TERM_LABELS[r.term]} · {r.academicYear}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-slate-500">
                    {formatReportDate(r.periodStart)} –{" "}
                    {formatReportDate(r.periodEnd)}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/teacher/reports/progress/${r.id}`}>
                        {r.status === "published" ? "View" : "Edit"}
                      </Link>
                    </Button>
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
