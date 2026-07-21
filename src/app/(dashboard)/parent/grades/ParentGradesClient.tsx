"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ClipboardList } from "lucide-react";
import type { Student, Term } from "@/lib/db/types";
import type { ChildGrades } from "./page";

const TERM_LABELS: Record<Term, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

function gradeBadge(grade: string) {
  const g = grade.trim().charAt(0).toUpperCase();
  if (g === "A" || g === "B")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (g === "C" || g === "D")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

export function ParentGradesClient({
  childrenList,
  gradesByChild,
  subjectNames,
}: {
  childrenList: Student[];
  gradesByChild: Record<string, ChildGrades>;
  subjectNames: Record<string, string>;
}) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const effectiveChildId =
    selectedChildId && childrenList.some((c) => c.id === selectedChildId)
      ? selectedChildId
      : childrenList[0]?.id ?? null;

  const selectedChild = effectiveChildId
    ? childrenList.find((c) => c.id === effectiveChildId) ?? null
    : null;
  const grades = selectedChild ? gradesByChild[selectedChild.id] ?? null : null;
  const latestCard = grades?.card ?? null;
  const rows = grades?.rows ?? [];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-slate-900 mb-1">
          Subject Grades
        </h1>
        <p className="text-sm text-slate-500">
          A quick look at your child&apos;s most recent subject performance.
        </p>
      </div>

      {/* Child selector */}
      {childrenList.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {childrenList.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                effectiveChildId === child.id
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {child.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {!selectedChild ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            No children are linked to your account yet.
          </CardContent>
        </Card>
      ) : !latestCard ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-800">No grades yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Grades appear here once {selectedChild.name.split(" ")[0]}&apos;s
              first report card is published.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {TERM_LABELS[latestCard.term]} · {latestCard.academic_year}
              </span>
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/parent/results/${latestCard.id}`}>
                View full report card
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map((row) => (
              <Card key={row.id} className="border-slate-100 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {subjectNames[row.subject_id] ?? row.subject_id}
                      </p>
                      <p className="text-xs text-slate-500">
                        {Number(row.total)} / 100
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-sm font-semibold shrink-0 ${gradeBadge(row.grade ?? "")}`}
                  >
                    {row.grade ?? "—"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
