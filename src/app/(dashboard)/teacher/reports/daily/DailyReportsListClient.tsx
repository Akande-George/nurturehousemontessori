"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Loader2, Plus, Users } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  generateDailyReport,
  generateDailyReportsForStudents,
} from "@/lib/actions/daily";
import { formatLongDate, moodEmoji } from "@/lib/montessori/daily";
import type { Enums } from "@/lib/db/types";

type StudentLite = {
  id: string;
  name: string;
  classroom: string | null;
  hasAgeGroup: boolean;
};

type ReportLite = {
  id: string;
  studentId: string;
  studentName: string;
  reportDate: string;
  status: Enums["daily_report_status"];
  mood: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

export function DailyReportsListClient({
  students,
  reports,
}: {
  students: StudentLite[];
  reports: ReportLite[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const [reportDate, setReportDate] = useState(today);
  const [selected, setSelected] = useState<string[]>([]);
  const [filterDate, setFilterDate] = useState("");

  const eligible = students.filter((s) => s.hasAgeGroup);
  const missingAgeGroup = students.filter((s) => !s.hasAgeGroup);

  const visible = filterDate
    ? reports.filter((r) => r.reportDate === filterDate)
    : reports;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const handleGenerate = () => {
    if (selected.length === 0) {
      toast({ title: "Pick at least one child", variant: "destructive" });
      return;
    }
    start(async () => {
      if (selected.length === 1) {
        const res = await generateDailyReport({
          studentId: selected[0],
          reportDate,
        });
        if (res.ok && res.id) {
          setOpen(false);
          router.push(`/teacher/reports/daily/${res.id}`);
        } else {
          toast({
            title: res.error ?? "Could not generate the report",
            variant: "destructive",
          });
        }
        return;
      }
      const res = await generateDailyReportsForStudents({
        studentIds: selected,
        reportDate,
      });
      if (res.ok) {
        setOpen(false);
        setSelected([]);
        toast({
          title: `${res.created} draft${res.created === 1 ? "" : "s"} ready`,
          description: res.skipped
            ? `${res.skipped} skipped — already sent, or missing an age group.`
            : "Open each one to add your notes, then send.",
        });
        router.refresh();
      } else {
        toast({ title: res.error ?? "Could not generate", variant: "destructive" });
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl text-slate-900">Daily Reports</h1>
          <p className="text-sm text-slate-500">
            A full record of each child&apos;s day — meals, rest, the work they
            chose, observations and photographs.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={eligible.length === 0}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> New reports
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate daily reports</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date</label>
                <Input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Children
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSelected(
                        selected.length === eligible.length
                          ? []
                          : eligible.map((s) => s.id),
                      )
                    }
                    className="text-xs text-montessori-primary hover:underline"
                  >
                    {selected.length === eligible.length
                      ? "Clear all"
                      : "Select all"}
                  </button>
                </div>
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                  {eligible.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={selected.includes(s.id)}
                        onCheckedChange={() => toggle(s.id)}
                      />
                      {s.name}
                      {s.classroom && (
                        <span className="text-xs text-slate-400">
                          {s.classroom}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {missingAgeGroup.length > 0 && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  {missingAgeGroup.length} child
                  {missingAgeGroup.length === 1 ? "" : "ren"} can&apos;t be
                  included until an age group is set on their profile:{" "}
                  {missingAgeGroup.map((s) => s.name).join(", ")}.
                </p>
              )}

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
                  {selected.length > 1
                    ? `Generate ${selected.length}`
                    : "Generate"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {students.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">
          No children yet. Add children before writing daily reports.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-auto border-slate-200"
            />
            {filterDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterDate("")}
              >
                Clear filter
              </Button>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                {filterDate ? (
                  <CalendarDays className="h-6 w-6" />
                ) : (
                  <Users className="h-6 w-6" />
                )}
              </div>
              <p className="text-sm text-slate-500">
                {filterDate
                  ? `No daily reports for ${formatLongDate(filterDate)}.`
                  : "No daily reports yet. Generate the first ones to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Child</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mood</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-slate-900">
                        {r.studentName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-500">
                        {formatLongDate(r.reportDate)}
                      </TableCell>
                      <TableCell>
                        {r.mood ? (
                          <span className="text-sm text-slate-600">
                            <span className="mr-1">{moodEmoji(r.mood)}</span>
                            {r.mood}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            r.status === "sent"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }
                        >
                          {r.status === "sent" ? "Sent" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/teacher/reports/daily/${r.id}`}>
                            {r.status === "sent" ? "View" : "Edit"}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
