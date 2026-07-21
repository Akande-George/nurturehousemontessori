"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookMarked, CalendarClock } from "lucide-react";
import type { Student } from "@/lib/db/types";
import type { HomeworkWithSubmission } from "@/lib/db/homework";

function statusMeta(status: string | undefined): {
  label: string;
  className: string;
} {
  switch (status) {
    case "graded":
      return {
        label: "Graded",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "submitted":
      return {
        label: "Submitted",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    default:
      return {
        label: "Assigned",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
  }
}

export function ParentHomeworkClient({
  childrenList,
  homeworkByChild,
  subjectNames,
}: {
  childrenList: Student[];
  homeworkByChild: Record<string, HomeworkWithSubmission[]>;
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
  const homework = selectedChild
    ? homeworkByChild[selectedChild.id] ?? []
    : [];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-slate-900 mb-1">Homework</h1>
        <p className="text-sm text-slate-500">
          Assignments set for your child, with their submission status.
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
      ) : homework.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center">
            <BookMarked className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-800">
              No homework set
            </p>
            <p className="text-sm text-slate-500 mt-1">
              There are no assignments for {selectedChild.name.split(" ")[0]}{" "}
              right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {homework.map((hw) => {
            const subjectName = hw.subject_id
              ? subjectNames[hw.subject_id] ?? null
              : null;
            const meta = statusMeta(hw.submission?.status);
            return (
              <Card key={hw.id} className="border-slate-100 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-montessori-primary/10 text-montessori-primary flex items-center justify-center shrink-0">
                        <BookMarked className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {hw.title}
                        </p>
                        {subjectName && (
                          <p className="text-xs text-montessori-primary font-medium mt-0.5">
                            {subjectName}
                          </p>
                        )}
                        {hw.description && (
                          <p className="text-sm text-slate-600 mt-1">
                            {hw.description}
                          </p>
                        )}
                        {hw.due_date && (
                          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <CalendarClock className="w-3.5 h-3.5" />
                            Due{" "}
                            {new Date(hw.due_date).toLocaleDateString("en-NG", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${meta.className}`}
                      >
                        {meta.label}
                      </Badge>
                      {hw.submission?.status === "graded" &&
                        hw.submission.grade && (
                          <span className="text-sm font-semibold text-slate-900">
                            {hw.submission.grade}
                          </span>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
