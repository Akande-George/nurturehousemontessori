"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { recordAttendance } from "@/lib/actions/operations";
import type {
  Attendance,
  AttendanceStatus,
  SchoolClass,
  Student,
} from "@/lib/db/types";
import { Check, Clock, X, Plane } from "lucide-react";

const STATUSES: AttendanceStatus[] = ["present", "late", "absent", "excused"];

const STATUS_TONE: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-200",
  late: "bg-amber-100 text-amber-700 border-amber-200",
  absent: "bg-rose-100 text-rose-700 border-rose-200",
  excused: "bg-sky-100 text-sky-700 border-sky-200",
};

const STATUS_ICON: Record<AttendanceStatus, typeof Check> = {
  present: Check,
  late: Clock,
  absent: X,
  excused: Plane,
};

export function AttendanceClient({
  classes,
  students,
  attendance,
  date,
  classId,
}: {
  classes: SchoolClass[];
  students: Student[];
  attendance: Attendance[];
  date: string;
  classId: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [noteFor, setNoteFor] = useState<Record<string, string>>({});

  const recordByStudent = useMemo(() => {
    const map: Record<string, Attendance> = {};
    for (const r of attendance) map[r.student_id] = r;
    return map;
  }, [attendance]);

  const pushParams = (next: { date?: string; classId?: string }) => {
    const params = new URLSearchParams();
    params.set("date", next.date ?? date);
    params.set("classId", next.classId ?? classId);
    router.push(`?${params.toString()}`);
  };

  const handleSet = (studentId: string, status: AttendanceStatus) => {
    start(async () => {
      const res = await recordAttendance({
        studentId,
        date,
        status,
        notes: noteFor[studentId]?.trim() || undefined,
      });
      if (res.ok) {
        toast({ title: `Marked ${status}` });
      } else {
        toast({ title: res.error ?? "Failed to record", variant: "destructive" });
      }
    });
  };

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
    };
    for (const s of students) {
      const r = recordByStudent[s.id];
      if (r) counts[r.status] += 1;
    }
    return counts;
  }, [students, recordByStudent]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Record who is present today. Admin and parents can see your
            submissions.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => pushParams({ date: e.target.value })}
              className="w-44"
            />
          </div>
          {classes.length > 1 && (
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">
                Class
              </label>
              <select
                value={classId}
                onChange={(e) => pushParams({ classId: e.target.value })}
                className="h-9 border border-slate-200 rounded-md px-3 text-sm bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUSES.map((s) => (
          <Card key={s} className="border-slate-100 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  {s}
                </p>
                <p className="text-2xl font-serif text-slate-900 mt-1">
                  {summary[s]}
                </p>
              </div>
              <Badge variant="outline" className={`${STATUS_TONE[s]} capitalize`}>
                {s}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roster */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Roster ({students.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-50">
          {students.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No students are enrolled in this class yet.
            </p>
          ) : (
            students.map((student) => {
              const r = recordByStudent[student.id];
              const current = r?.status;
              return (
                <div
                  key={student.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 py-3"
                >
                  <div className="flex items-center gap-3 sm:w-56 shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full ${student.avatar_color} text-white flex items-center justify-center text-xs font-bold shrink-0`}
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
                      {student.classroom && (
                        <p className="text-xs text-slate-500 truncate">
                          {student.classroom}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => {
                      const Icon = STATUS_ICON[s];
                      const active = current === s;
                      return (
                        <button
                          key={s}
                          disabled={pending}
                          onClick={() => handleSet(student.id, s)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border transition-all disabled:opacity-60 ${
                            active
                              ? STATUS_TONE[s]
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span className="capitalize">{s}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex-1 min-w-[180px]">
                    <Input
                      placeholder="Note (optional)"
                      value={noteFor[student.id] ?? r?.notes ?? ""}
                      onChange={(e) =>
                        setNoteFor((prev) => ({
                          ...prev,
                          [student.id]: e.target.value,
                        }))
                      }
                      className="h-9 text-sm bg-white"
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
