"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { recordAttendance } from "@/lib/actions/operations";
import type { Attendance, AttendanceStatus, Student } from "@/lib/db/types";

const STATUSES: AttendanceStatus[] = ["present", "late", "absent", "excused"];

const STATUS_TONE: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-200",
  late: "bg-amber-100 text-amber-700 border-amber-200",
  absent: "bg-rose-100 text-rose-700 border-rose-200",
  excused: "bg-sky-100 text-sky-700 border-sky-200",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export function AttendanceClient({
  students,
  attendance,
  date,
}: {
  students: Student[];
  attendance: Attendance[];
  date: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const statusByStudent = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const a of attendance) map[a.student_id] = a.status;
    return map;
  }, [attendance]);

  const classrooms = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) if (s.classroom) set.add(s.classroom);
    return [...set].sort();
  }, [students]);

  const [classroomFilter, setClassroomFilter] = useState<string>("all");

  const filtered = students.filter((s) =>
    classroomFilter === "all" ? true : s.classroom === classroomFilter,
  );

  const summary = useMemo(() => {
    const out: Record<AttendanceStatus, number> = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
    };
    for (const a of attendance) out[a.status] += 1;
    return out;
  }, [attendance]);

  const changeDate = (next: string) => {
    start(() => {
      router.push(`/dashboard/attendance?date=${next}`);
    });
  };

  const mark = (studentId: string, name: string, status: AttendanceStatus) => {
    start(async () => {
      const res = await recordAttendance({ studentId, date, status });
      if (res.ok) {
        toast({
          title: "Attendance recorded",
          description: `${name.split(" ")[0]} marked ${status}.`,
        });
        router.refresh();
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and record attendance across the school.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => changeDate(e.target.value)}
              disabled={pending}
              className="w-44"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">
              Class
            </label>
            <select
              value={classroomFilter}
              onChange={(e) => setClassroomFilter(e.target.value)}
              className="h-9 border border-slate-200 rounded-md px-3 text-sm bg-white"
            >
              <option value="all">All classes</option>
              {classrooms.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

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
          <CardTitle>
            {filtered.length} student{filtered.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-6 text-center">
              No students found for this filter.
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((student) => {
                const status = statusByStudent[student.id];
                return (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 py-3"
                  >
                    <div className="flex items-center gap-3 sm:w-64 shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full ${student.avatar_color} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                      >
                        {initials(student.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {student.classroom ?? ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => mark(student.id, student.name, s)}
                          disabled={pending}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize transition-colors disabled:opacity-50 ${
                            status === s
                              ? STATUS_TONE[s]
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
