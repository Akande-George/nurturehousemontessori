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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  publishReportCard,
  setReportCardRemarks,
} from "@/lib/actions/academics";
import type { ReportCard, SchoolClass, Student, Term } from "@/lib/db/types";
import { FileText, RefreshCw, Save } from "lucide-react";

const TERMS: { value: Term; label: string }[] = [
  { value: "first", label: "First Term" },
  { value: "second", label: "Second Term" },
  { value: "third", label: "Third Term" },
];

export function ReportCardsClient({
  classes,
  studentsByClass,
  cardsByStudent,
}: {
  classes: SchoolClass[];
  studentsByClass: Record<string, Student[]>;
  cardsByStudent: Record<string, ReportCard[]>;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [classId, setClassId] = useState<string>(classes[0]?.id ?? "");
  const [term, setTerm] = useState<Term>("first");
  const [remarkDrafts, setRemarkDrafts] = useState<Record<string, string>>({});

  const students = classId ? studentsByClass[classId] ?? [] : [];

  const cardFor = (studentId: string): ReportCard | null =>
    (cardsByStudent[studentId] ?? []).find(
      (c) => c.class_id === classId && c.term === term,
    ) ?? null;

  const handleGenerate = (studentId: string) => {
    start(async () => {
      const res = await publishReportCard(studentId, classId, term);
      if (res.ok) {
        toast({ title: "Report card generated" });
      } else {
        toast({ title: res.error ?? "Failed to generate", variant: "destructive" });
      }
    });
  };

  const handleSaveRemark = (cardId: string) => {
    start(async () => {
      const res = await setReportCardRemarks(cardId, {
        teacher_remark: remarkDrafts[cardId] ?? "",
      });
      if (res.ok) {
        toast({ title: "Teacher remark saved" });
      } else {
        toast({ title: res.error ?? "Failed to save", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-slate-900 mb-1">
          Report Cards
        </h1>
        <p className="text-sm text-slate-500">
          Generate end-of-term report cards and add your teacher remark for each
          student.
        </p>
      </div>

      <Card className="border-slate-100 shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-base">Selection</CardTitle>
          <CardDescription>Choose a class and term.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block text-xs text-slate-500">Class</Label>
            <Select value={classId} onValueChange={(v) => setClassId(v)}>
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

      {!classId ? (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="py-10">
            <p className="text-sm text-slate-500 text-center">
              Select a class to view students.
            </p>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="py-10">
            <p className="text-sm text-slate-500 text-center">
              No students are enrolled in this class yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {students.map((student) => {
            const card = cardFor(student.id);
            const draft =
              card && remarkDrafts[card.id] !== undefined
                ? remarkDrafts[card.id]
                : card?.teacher_remark ?? "";
            return (
              <Card key={student.id} className="border-slate-100 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full ${student.avatar_color} text-slate-700 flex items-center justify-center text-sm font-bold shrink-0`}
                      >
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {student.name}
                        </p>
                        {card ? (
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              Average {Number(card.average).toFixed(1)}%
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-sky-50 text-sky-700 border-sky-200"
                            >
                              Position {card.overall_position} of{" "}
                              {card.class_size}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-slate-50 text-slate-600 border-slate-200"
                            >
                              Grade {card.overall_grade}
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 mt-1">
                            Not generated yet
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant={card ? "outline" : "default"}
                      disabled={pending}
                      onClick={() => handleGenerate(student.id)}
                      className={
                        card
                          ? "gap-2 shrink-0"
                          : "bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2 shrink-0"
                      }
                    >
                      {card ? (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>

                  {card && (
                    <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1.5 block text-xs text-slate-500">
                          Teacher remark
                        </Label>
                        <Textarea
                          value={draft}
                          onChange={(e) =>
                            setRemarkDrafts((prev) => ({
                              ...prev,
                              [card.id]: e.target.value,
                            }))
                          }
                          className="min-h-[90px]"
                          placeholder="Write your remark for this student."
                        />
                        <div className="mt-2 flex justify-end">
                          <Button
                            size="sm"
                            disabled={pending}
                            onClick={() => handleSaveRemark(card.id)}
                            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Save remark
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-xs text-slate-500">
                          Principal remark
                        </Label>
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 min-h-[90px]">
                          {card.principal_remark || (
                            <span className="text-slate-400">
                              Set by the administrator.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
