"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText, RefreshCw, ChevronRight, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { publishReportCard } from "@/lib/actions/academics";
import type { SchoolClass, Term } from "@/lib/db/types";

export type CardSummary = {
  id: string;
  student_id: string;
  class_id: string;
  term: Term;
  average: number;
  overall_position: number | null;
  class_size: number | null;
};

const TERMS: { value: Term; label: string }[] = [
  { value: "first", label: "First Term" },
  { value: "second", label: "Second Term" },
  { value: "third", label: "Third Term" },
];

export function ResultsClient({
  classes,
  studentsByClass,
  cards,
}: {
  classes: SchoolClass[];
  studentsByClass: Record<string, { id: string; name: string }[]>;
  cards: CardSummary[];
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [term, setTerm] = useState<Term>("first");

  const students = classId ? studentsByClass[classId] ?? [] : [];
  const cardFor = (studentId: string) =>
    cards.find(
      (c) =>
        c.student_id === studentId &&
        c.class_id === classId &&
        c.term === term,
    );

  const handleGenerate = (studentId: string) => {
    start(async () => {
      const res = await publishReportCard(studentId, classId, term);
      if (res.ok) toast({ title: "Report card generated" });
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Results</h1>
          <p className="text-sm text-slate-500">
            Generate and review termly report cards for each class.
          </p>
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Term</Label>
              <Select
                value={term}
                onValueChange={(value) => setTerm(value as Term)}
              >
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue />
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
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-0">
          {!classId || students.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No students to show
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Pick a class with enrolled students to generate report cards.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Report Card</TableHead>
                  <TableHead>Average</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const card = cardFor(student.id);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-900">
                            {student.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {card ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 border-none"
                          >
                            Generated
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-500 border-none"
                          >
                            Not generated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {card ? `${Number(card.average).toFixed(1)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {card
                          ? `${card.overall_position} of ${card.class_size}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            disabled={pending}
                            onClick={() => handleGenerate(student.id)}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {card ? "Regenerate" : "Generate"}
                          </Button>
                          {card && (
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5"
                            >
                              <Link href={`/dashboard/results/${student.id}`}>
                                <FileText className="w-3.5 h-3.5" /> View
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
