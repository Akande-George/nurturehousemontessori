"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getAllAttendance,
  getAllClassroomNames,
  getStudentById,
  useDemoStore,
  type AttendanceStatus,
} from "@/lib/mock/demo-store";
import { downloadStructuredPdf } from "@/lib/pdf/download-pdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const STATUS_TONE: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-200",
  late: "bg-amber-100 text-amber-700 border-amber-200",
  absent: "bg-rose-100 text-rose-700 border-rose-200",
  excused: "bg-sky-100 text-sky-700 border-sky-200",
};

export default function AdminAttendancePage() {
  useDemoStore();
  const records = getAllAttendance();
  const classrooms = getAllClassroomNames();

  const allDates = useMemo(() => {
    const set = new Set(records.map((r) => r.date));
    return [...set].sort().reverse();
  }, [records]);

  const [date, setDate] = useState(allDates[0] ?? new Date().toISOString().slice(0, 10));
  const [classroomFilter, setClassroomFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "all">(
    "all",
  );

  const filtered = useMemo(() => {
    return records
      .filter((r) => r.date === date)
      .map((r) => ({ record: r, student: getStudentById(r.studentId) }))
      .filter(({ student }) => {
        if (!student) return false;
        if (classroomFilter !== "all" && student.classroom !== classroomFilter)
          return false;
        return true;
      })
      .filter(({ record }) =>
        statusFilter === "all" ? true : record.status === statusFilter,
      );
  }, [records, date, classroomFilter, statusFilter]);

  const summary = useMemo(() => {
    const out: Record<AttendanceStatus, number> = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
    };
    for (const r of records.filter((x) => x.date === date)) {
      out[r.status] += 1;
    }
    return out;
  }, [records, date]);

  const exportPdf = async () => {
    await downloadStructuredPdf({
      filename: `attendance-${date}.pdf`,
      header: "Nurture House Montessori · Attendance Submissions",
      footer: `Generated ${new Date().toLocaleDateString("en-NG")}`,
      lines: [
        { kind: "title", text: "Attendance" },
        {
          kind: "subtitle",
          text: new Date(date).toLocaleDateString("en-NG", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        },
        { kind: "rule" },
        {
          kind: "table",
          headers: ["Student", "Class", "Status", "Notes"],
          rows: filtered.map(({ record, student }) => [
            student?.name ?? record.studentId,
            student?.classroom ?? "",
            record.status,
            record.notes ?? "",
          ]),
        },
      ],
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">
            All attendance submitted by classroom teachers.
          </p>
        </div>
        <Button onClick={exportPdf} variant="outline" className="gap-2 bg-white">
          <Download className="w-4 h-4" /> Export day as PDF
        </Button>
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
              onChange={(e) => setDate(e.target.value)}
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
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as AttendanceStatus | "all")
              }
              className="h-9 border border-slate-200 rounded-md px-3 text-sm bg-white"
            >
              <option value="all">All statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["present", "late", "absent", "excused"] as const).map((s) => (
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
          <CardTitle>{filtered.length} submission{filtered.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-6 text-center">
              No attendance records for this filter.
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(({ record, student }) => (
                <div
                  key={record.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 py-3"
                >
                  <div className="flex items-center gap-3 sm:w-64 shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full ${student?.avatarColor ?? "bg-slate-300"} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                    >
                      {student?.name.split(" ").map((n) => n[0]).join("") ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {student?.name ?? record.studentId}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {student?.classroom ?? ""}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${STATUS_TONE[record.status]} capitalize w-fit`}
                  >
                    {record.status}
                  </Badge>
                  {record.notes && (
                    <p className="text-xs text-slate-500 flex-1">
                      {record.notes}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 sm:ml-auto">
                    Recorded {new Date(record.createdAt).toLocaleTimeString(
                      "en-NG",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
