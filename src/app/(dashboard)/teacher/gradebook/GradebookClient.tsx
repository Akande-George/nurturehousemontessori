"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { saveScores } from "@/lib/actions/academics";
import type {
  AssessmentScore,
  CAComponent,
  SchoolClass,
  Student,
  Subject,
  Term,
} from "@/lib/db/types";
import { Save } from "lucide-react";

const TERMS: { value: Term; label: string }[] = [
  { value: "first", label: "First Term" },
  { value: "second", label: "Second Term" },
  { value: "third", label: "Third Term" },
];

type Marks = { ca: number; exam: number };
const EMPTY_MARKS: Marks = { ca: 0, exam: 0 };
const MAX = { ca: 40, exam: 60 };

function clamp(value: number, max: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(max, value));
}

function caTotal(ca: unknown): number {
  if (!Array.isArray(ca)) return 0;
  return (ca as CAComponent[]).reduce((sum, c) => sum + (Number(c?.score) || 0), 0);
}

function examScore(exam: unknown): number {
  if (exam && typeof exam === "object") {
    return Number((exam as { score?: number }).score) || 0;
  }
  return 0;
}

export function GradebookClient({
  classes,
  subjectsByClass,
  studentsByClass,
  scoresByKey,
}: {
  classes: SchoolClass[];
  subjectsByClass: Record<string, Subject[]>;
  studentsByClass: Record<string, Student[]>;
  scoresByKey: Record<string, AssessmentScore[]>;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [classId, setClassId] = useState<string>(classes[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState<string>("");
  const [term, setTerm] = useState<Term>("first");

  const subjects = classId ? subjectsByClass[classId] ?? [] : [];
  const activeSubjectId =
    subjects.find((s) => s.id === subjectId)?.id ?? subjects[0]?.id ?? "";
  const students = classId ? studentsByClass[classId] ?? [] : [];

  const gridKey = `${classId}:${activeSubjectId}:${term}`;
  const [marks, setMarks] = useState<Record<string, Marks>>({});
  const [seededKey, setSeededKey] = useState<string>("");

  if (seededKey !== gridKey && classId && activeSubjectId) {
    const rows = scoresByKey[gridKey] ?? [];
    const byStudent = new Map(rows.map((r) => [r.student_id, r]));
    const seed: Record<string, Marks> = {};
    for (const student of students) {
      const existing = byStudent.get(student.id);
      seed[student.id] = existing
        ? { ca: caTotal(existing.ca), exam: examScore(existing.exam) }
        : { ...EMPTY_MARKS };
    }
    setMarks(seed);
    setSeededKey(gridKey);
  }

  const update = (studentId: string, field: keyof Marks, raw: string) => {
    const value = clamp(parseInt(raw, 10), MAX[field]);
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? EMPTY_MARKS), [field]: value },
    }));
  };

  const totalFor = (m: Marks) => m.ca + m.exam;

  const handleSave = () => {
    if (!classId || !activeSubjectId) return;
    start(async () => {
      const rows = students.map((student) => {
        const m = marks[student.id] ?? EMPTY_MARKS;
        return {
          studentId: student.id,
          ca: [{ label: "CA", score: m.ca, max: 40 }] as CAComponent[],
          exam: { score: m.exam, max: 60 },
        };
      });
      const res = await saveScores({
        classId,
        subjectId: activeSubjectId,
        term,
        rows,
      });
      if (res.ok) {
        toast({
          title: "Marks saved",
          description: `Scores recorded for ${students.length} student${
            students.length === 1 ? "" : "s"
          }.`,
        });
      } else {
        toast({ title: res.error ?? "Failed to save", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-slate-900 mb-1">Gradebook</h1>
        <p className="text-sm text-slate-500">
          Record continuous assessment and exam marks for your class and
          subject.
        </p>
      </div>

      <Card className="border-slate-100 shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-base">Selection</CardTitle>
          <CardDescription>
            Pick the class, subject and term you want to enter marks for.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="mb-1.5 block text-xs text-slate-500">Class</Label>
            <Select
              value={classId}
              onValueChange={(v) => {
                setClassId(v);
                setSubjectId("");
              }}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-slate-500">
              Subject
            </Label>
            <Select
              value={activeSubjectId}
              onValueChange={(v) => setSubjectId(v)}
              disabled={subjects.length === 0}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-slate-500">Term</Label>
            <Select value={term} onValueChange={(v) => setTerm(v as Term)}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {TERMS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base">Marks</CardTitle>
            <CardDescription>
              Totals are calculated automatically out of 100.
            </CardDescription>
          </div>
          <Button
            onClick={handleSave}
            disabled={
              pending || !classId || !activeSubjectId || students.length === 0
            }
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
          >
            <Save className="w-4 h-4" />
            Save marks
          </Button>
        </CardHeader>
        <CardContent>
          {!classId || !activeSubjectId ? (
            <p className="text-sm text-slate-500 py-10 text-center border border-dashed rounded-xl border-slate-200">
              Select a class and subject to begin entering marks.
            </p>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500 py-10 text-center border border-dashed rounded-xl border-slate-200">
              No students are enrolled in this class yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table key={gridKey}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Student</TableHead>
                    <TableHead className="text-center">CA /40</TableHead>
                    <TableHead className="text-center">Exam /60</TableHead>
                    <TableHead className="text-center">Total /100</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const m = marks[student.id] ?? EMPTY_MARKS;
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium text-slate-900">
                          {student.name}
                        </TableCell>
                        {(["ca", "exam"] as const).map((field) => (
                          <TableCell key={field} className="text-center">
                            <Input
                              type="number"
                              min={0}
                              max={MAX[field]}
                              value={m[field]}
                              onChange={(e) =>
                                update(student.id, field, e.target.value)
                              }
                              className="w-20 mx-auto text-center h-9"
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-semibold text-montessori-primary">
                          {totalFor(m)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
