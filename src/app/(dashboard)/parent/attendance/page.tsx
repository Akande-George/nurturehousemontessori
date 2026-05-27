"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAttendanceForStudent,
  getRoleUser,
  getStudentsForParent,
  useDemoStore,
  type AttendanceStatus,
} from "@/lib/mock/demo-store";

const STATUS_TONE: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-200",
  late: "bg-amber-100 text-amber-700 border-amber-200",
  absent: "bg-rose-100 text-rose-700 border-rose-200",
  excused: "bg-sky-100 text-sky-700 border-sky-200",
};

export default function ParentAttendancePage() {
  useDemoStore();
  const parent = getRoleUser("parent");
  const children = getStudentsForParent(parent.id);

  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    children.length > 0 ? children[0].id : null,
  );

  const selectedChild = selectedChildId
    ? children.find((c) => c.id === selectedChildId)
    : null;
  const records = selectedChild
    ? getAttendanceForStudent(selectedChild.id)
    : [];

  const summary = useMemo(() => {
    const out: Record<AttendanceStatus, number> = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
    };
    for (const r of records) out[r.status] += 1;
    return out;
  }, [records]);

  const total = records.length;
  const attendanceRate =
    total === 0
      ? 0
      : Math.round(((summary.present + summary.late) / total) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Daily attendance recorded by your child's teacher.
        </p>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                selectedChildId === child.id
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full ${child.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}
              >
                {child.name[0]}
              </div>
              {child.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {selectedChild ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                { key: "present" as const, label: "Present" },
                { key: "late" as const, label: "Late" },
                { key: "absent" as const, label: "Absent" },
                { key: "excused" as const, label: "Excused" },
              ]
            ).map((s) => (
              <Card key={s.key} className="border-slate-100 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    {s.label}
                  </p>
                  <p className="text-2xl font-serif text-slate-900 mt-1">
                    {summary[s.key]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Attendance rate */}
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  Attendance rate
                </p>
                <p className="text-3xl font-serif text-slate-900 mt-1">
                  {attendanceRate}%
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  across {total} day{total === 1 ? "" : "s"} recorded
                </p>
              </div>
              <div
                className="w-20 h-20 rounded-full grid place-items-center text-sm font-bold"
                style={{
                  background: `conic-gradient(rgb(12 92 76) ${attendanceRate}%, #e2e8f0 ${attendanceRate}%)`,
                }}
              >
                <div className="w-14 h-14 rounded-full bg-white grid place-items-center text-slate-700">
                  {attendanceRate}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily log */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle>Daily log</CardTitle>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-6 text-center">
                  No attendance recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {records.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(r.date).toLocaleDateString("en-NG", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        {r.notes && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {r.notes}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`${STATUS_TONE[r.status]} capitalize`}
                      >
                        {r.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            Select a child to view their attendance.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
