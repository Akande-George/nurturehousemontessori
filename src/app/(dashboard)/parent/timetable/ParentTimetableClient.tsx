"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock } from "lucide-react";
import type { Student, TimetablePeriod } from "@/lib/db/types";

const DAYS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

function trimTime(t: string) {
  // "08:30:00" -> "08:30"
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export function ParentTimetableClient({
  childrenList,
  periodsByChild,
  subjectNames,
}: {
  childrenList: Student[];
  periodsByChild: Record<string, TimetablePeriod[]>;
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
  const periods: TimetablePeriod[] = selectedChild
    ? periodsByChild[selectedChild.id] ?? []
    : [];

  const byDay = (day: number) => periods.filter((p) => p.day_of_week === day);

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-slate-900 mb-1">
          Class Timetable
        </h1>
        <p className="text-sm text-slate-500">
          Your child&apos;s weekly class schedule, Monday to Friday.
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
      ) : periods.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-800">
              No timetable available
            </p>
            <p className="text-sm text-slate-500 mt-1">
              A weekly timetable has not been published for this class yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {DAYS.map((day) => {
            const dayPeriods = byDay(day.value);
            return (
              <Card key={day.value} className="border-slate-100 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                    {day.label}
                  </p>
                  {dayPeriods.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No classes</p>
                  ) : (
                    <div className="space-y-2">
                      {dayPeriods.map((period) => (
                        <div
                          key={period.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {period.subject_id
                              ? subjectNames[period.subject_id] ?? period.subject_id
                              : "—"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {trimTime(period.start_time)} – {trimTime(period.end_time)}
                          </p>
                        </div>
                      ))}
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
