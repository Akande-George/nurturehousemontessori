"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Star, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { upsertTermlyReport } from "@/lib/actions/montessori";
import { CHARACTER_TRAITS, RATING_LABELS } from "@/lib/montessori/character";
import { summarizeByArea, type ObsLite } from "@/lib/montessori/term-summary";
import type { Progress } from "@/lib/db/montessori";

const TERMS = ["First Term", "Second Term", "Third Term"];

type StudentLite = { id: string; name: string; classroom: string | null };

function StarRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-5 h-5 ${
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-xs text-slate-400 w-24">
        {value ? RATING_LABELS[value] : "Not rated"}
      </span>
    </div>
  );
}

export function TeacherTermlyClient({
  students,
  obsByStudent,
  reportByStudent,
}: {
  students: StudentLite[];
  obsByStudent: Record<string, ObsLite[]>;
  reportByStudent: Record<string, Progress | null>;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [selectedId, setSelectedId] = useState(students[0]?.id ?? "");

  const [term, setTerm] = useState("First Term");
  const [academicYear, setAcademicYear] = useState("");
  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [growth, setGrowth] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // Prefill whenever the selected student changes.
  useEffect(() => {
    const r = reportByStudent[selectedId] ?? null;
    setTerm(r?.term ?? "First Term");
    setAcademicYear(r?.academic_year ?? "");
    setSummary(r?.teacher_comments ?? "");
    setStrengths((r?.strengths ?? []).join("\n"));
    setGrowth((r?.areas_for_growth ?? []).join("\n"));
    setRatings((r?.character_ratings as Record<string, number>) ?? {});
  }, [selectedId, reportByStudent]);

  const student = students.find((s) => s.id === selectedId);
  const rollup = useMemo(
    () => summarizeByArea(obsByStudent[selectedId] ?? []),
    [obsByStudent, selectedId],
  );
  const totalObs = (obsByStudent[selectedId] ?? []).length;

  const toLines = (s: string) =>
    s.split("\n").map((l) => l.trim()).filter(Boolean);

  const handleSave = () => {
    if (!student) return;
    if (!academicYear.trim()) {
      toast({ title: "Add the academic year", description: "e.g. 2025-2026", variant: "destructive" });
      return;
    }
    start(async () => {
      const res = await upsertTermlyReport({
        studentId: student.id,
        term,
        academicYear: academicYear.trim(),
        summary: summary.trim() || undefined,
        strengths: toLines(strengths),
        areasForGrowth: toLines(growth),
        characterRatings: ratings,
      });
      if (res.ok) {
        toast({ title: "Termly report saved", description: `${student.name}'s report is now visible to their parent.` });
      } else {
        toast({ title: res.error ?? "Failed to save", variant: "destructive" });
      }
    });
  };

  if (students.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-slate-500">
        No students yet. Add students before writing termly reports.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Termly Report</h1>
          <p className="text-sm text-slate-500">
            Write the end-of-term summary and character profile parents will see.
          </p>
        </div>
        <div className="w-full sm:max-w-[240px]">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="bg-white border-slate-200">
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Term activity summary (auto, from observations) */}
      <Card className="border-slate-100 shadow-sm bg-montessori-sky/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-montessori-primary" />
            This term at a glance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalObs === 0 ? (
            <p className="text-sm text-slate-500">
              No observations logged yet — add observations to build the activity summary.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-3">
                {totalObs} observation{totalObs === 1 ? "" : "s"} across {rollup.length} area
                {rollup.length === 1 ? "" : "s"}.
              </p>
              <div className="space-y-2">
                {rollup.map((r) => (
                  <div key={r.area} className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="secondary" className="bg-white text-slate-700 border border-slate-200">
                      {r.area} · {r.count}
                    </Badge>
                    {r.activities.length > 0 && (
                      <span className="text-slate-500">{r.activities.join(", ")}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Term</label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="bg-white border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TERMS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Academic year</label>
          <Input
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g. 2025-2026"
            className="border-slate-200"
          />
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Teacher&apos;s summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={`Summarise ${student?.name?.split(" ")[0] ?? "the child"}'s term — growth, highlights, and how they've settled…`}
            className="min-h-28 border-slate-200 focus-visible:ring-montessori-primary"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Strengths</label>
              <Textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="One per line"
                className="min-h-24 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Areas for growth</label>
              <Textarea
                value={growth}
                onChange={(e) => setGrowth(e.target.value)}
                placeholder="One per line"
                className="min-h-24 border-slate-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Character profile</CardTitle>
          <p className="text-sm text-slate-500">Rate each trait from 1 to 5 stars.</p>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {CHARACTER_TRAITS.map((trait) => (
              <div key={trait} className="flex items-center justify-between py-3 gap-4">
                <span className="text-sm font-medium text-slate-800">{trait}</span>
                <StarRow
                  value={ratings[trait] ?? 0}
                  onChange={(v) => setRatings((prev) => ({ ...prev, [trait]: v }))}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={pending}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
        >
          {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save termly report
        </Button>
      </div>
    </div>
  );
}
