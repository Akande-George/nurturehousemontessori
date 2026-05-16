"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Info, Check, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AttendanceStatus = "present" | "absent" | "late" | "excused" | null;

type AttendanceNote = {
  status: "absent" | "late";
  reason: string;
  guardianNotified: boolean;
  notifiedAt?: string;
};

type Student = {
  id: string;
  name: string;
  status: AttendanceStatus;
  time: string | null;
  notes: string;
  attendanceNote?: AttendanceNote;
};

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([
    {
      id: "1",
      name: "Sarah Jenkins",
      status: "present",
      time: "8:42 AM",
      notes: "",
    },
    {
      id: "2",
      name: "Leo Martinez",
      status: "absent",
      time: null,
      notes: "Called in sick",
      attendanceNote: {
        status: "absent",
        reason: "Illness reported by parent.",
        guardianNotified: true,
        notifiedAt: "8:05 AM",
      },
    },
    { id: "3", name: "Zoe Wong", status: null, time: null, notes: "" },
    {
      id: "4",
      name: "Elias Thorne",
      status: "present",
      time: "8:50 AM",
      notes: "",
    },
    {
      id: "5",
      name: "Mia Chen",
      status: "late",
      time: "9:15 AM",
      notes: "Traffic",
      attendanceNote: {
        status: "late",
        reason: "Traffic delay — arrived at 9:15 AM.",
        guardianNotified: false,
      },
    },
    { id: "6", name: "Jackson Lee", status: null, time: null, notes: "" },
    { id: "7", name: "Ava Patel", status: null, time: null, notes: "" },
    {
      id: "8",
      name: "Noah Davis",
      status: "present",
      time: "8:35 AM",
      notes: "",
    },
  ]);

  const [reportDialog, setReportDialog] = useState<{
    open: boolean;
    studentId: string;
    studentName: string;
    pendingStatus: "absent" | "late";
  } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [guardianNotified, setGuardianNotified] = useState(false);

  const { toast } = useToast();

  const handleAction = (actionName: string) => {
    toast({
      title: `${actionName} saved`,
      description: "Attendance updates have been stored in the demo register.",
    });
  };

  const markPresent = (id: string) => {
    setStudents(
      students.map((s) => {
        if (s.id === id) {
          const time = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          return {
            ...s,
            status: "present" as AttendanceStatus,
            time: s.status !== "present" ? time : s.time,
            attendanceNote: undefined,
          };
        }
        return s;
      }),
    );
  };

  const openReportDialog = (
    id: string,
    name: string,
    newStatus: "absent" | "late",
  ) => {
    const student = students.find((s) => s.id === id);
    // If already this status, just toggle off
    if (student?.status === newStatus) {
      setStudents(
        students.map((s) =>
          s.id === id
            ? { ...s, status: null, time: null, attendanceNote: undefined }
            : s,
        ),
      );
      return;
    }
    setReportReason(student?.attendanceNote?.reason ?? "");
    setGuardianNotified(student?.attendanceNote?.guardianNotified ?? false);
    setReportDialog({
      open: true,
      studentId: id,
      studentName: name,
      pendingStatus: newStatus,
    });
  };

  const confirmReport = () => {
    if (!reportDialog) return;
    const { studentId, pendingStatus } = reportDialog;
    const time =
      pendingStatus === "late"
        ? new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null;
    const notifiedAt = guardianNotified
      ? new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : undefined;

    setStudents(
      students.map((s) =>
        s.id === studentId
          ? {
              ...s,
              status: pendingStatus,
              time,
              attendanceNote: {
                status: pendingStatus,
                reason: reportReason.trim(),
                guardianNotified,
                notifiedAt,
              },
            }
          : s,
      ),
    );

    setReportDialog(null);
    setReportReason("");
    setGuardianNotified(false);

    toast({
      title: `${pendingStatus === "absent" ? "Absence" : "Late arrival"} recorded`,
      description: guardianNotified
        ? "Report saved and guardian marked as notified."
        : "Report saved. Remember to notify the guardian.",
    });
  };

  const markedCount = students.filter((s) => s.status !== null).length;
  const presentCount = students.filter(
    (s) => s.status === "present" || s.status === "late",
  ).length;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            Morning Attendance
          </h1>
          <p className="text-sm text-slate-500">
            Primary A (Elm Room) · Tuesday, October 24
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Input
              type="text"
              placeholder="Search student..."
              className="pl-9 border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <Button
            onClick={() => handleAction("Save Register")}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm shrink-0"
          >
            Save Register
          </Button>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="mb-6 border-slate-100 shadow-sm bg-slate-50 relative overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 bg-montessori-primary/10 transition-all duration-500"
          style={{ width: `${(markedCount / students.length) * 100}%` }}
        />
        <CardContent className="p-4 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-montessori-primary font-bold shadow-sm">
              {markedCount}/{students.length}
            </div>
            <div>
              <p className="font-medium text-slate-900">Attendance Register</p>
              <p className="text-sm text-slate-500">
                {markedCount === students.length
                  ? "All students marked."
                  : `${students.length - markedCount} students left to mark.`}
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block shrink-0">
            <p className="text-sm font-medium text-slate-900">
              {presentCount} Present
            </p>
            <p className="text-xs text-slate-500">Currently in class</p>
          </div>
        </CardContent>
      </Card>

      {/* Roster List */}
      <div className="space-y-3">
        {students.map((student) => (
          <Card
            key={student.id}
            className={`border-slate-100 shadow-sm overflow-hidden transition-all ${student.status === null ? "hover:border-montessori-primary/50" : ""}`}
          >
            <CardContent className="p-0 flex flex-col sm:flex-row items-center">
              <div className="p-4 flex-1 flex items-center gap-4 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium shrink-0 transition-colors ${
                    student.status === "present" || student.status === "late"
                      ? "bg-emerald-100 text-emerald-700"
                      : student.status === "absent" ||
                          student.status === "excused"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900">{student.name}</h3>
                  {student.time ? (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> In at {student.time}
                    </p>
                  ) : student.notes ? (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Info className="w-3 h-3" /> {student.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Not marked yet</p>
                  )}
                  {student.attendanceNote && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500 truncate max-w-[200px]">
                        {student.attendanceNote.reason}
                      </span>
                      {student.attendanceNote.guardianNotified && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 h-4 border-emerald-200 text-emerald-700 bg-emerald-50"
                        >
                          Guardian notified
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 bg-slate-50/50">
                <Button
                  variant={student.status === "present" ? "default" : "outline"}
                  size="sm"
                  onClick={() => markPresent(student.id)}
                  className={
                    student.status === "present"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto shadow-sm"
                      : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50 w-full sm:w-auto"
                  }
                >
                  {student.status === "present" && (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  Present
                </Button>

                <Button
                  variant={student.status === "late" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    openReportDialog(student.id, student.name, "late")
                  }
                  className={
                    student.status === "late"
                      ? "bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto shadow-sm"
                      : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50 w-full sm:w-auto"
                  }
                >
                  Late
                </Button>

                <Button
                  variant={student.status === "absent" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    openReportDialog(student.id, student.name, "absent")
                  }
                  className={
                    student.status === "absent"
                      ? "bg-rose-500 hover:bg-rose-600 text-white w-full sm:w-auto shadow-sm"
                      : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50 w-full sm:w-auto"
                  }
                >
                  Absent
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Report Dialog */}
      <Dialog
        open={!!reportDialog?.open}
        onOpenChange={(open) => {
          if (!open) {
            setReportDialog(null);
            setReportReason("");
            setGuardianNotified(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {reportDialog?.pendingStatus === "absent"
                ? "Record Absence"
                : "Record Late Arrival"}
            </DialogTitle>
            <DialogDescription>
              {reportDialog?.studentName} ·{" "}
              {reportDialog?.pendingStatus === "absent"
                ? "Mark as absent and log a reason."
                : "Mark as late and log a reason."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="att-reason">Reason / Notes</Label>
              <Textarea
                id="att-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder={
                  reportDialog?.pendingStatus === "absent"
                    ? "e.g. Illness reported by parent, medical appointment…"
                    : "e.g. Traffic, transport delay, appointment…"
                }
                className="min-h-[90px]"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={guardianNotified}
                onChange={(e) => setGuardianNotified(e.target.checked)}
                className="w-4 h-4 rounded accent-montessori-primary"
              />
              <span className="text-sm text-slate-700">
                Guardian has been notified
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReportDialog(null);
                setReportReason("");
                setGuardianNotified(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReport}
              className={
                reportDialog?.pendingStatus === "absent"
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              }
            >
              Confirm{" "}
              {reportDialog?.pendingStatus === "absent" ? "Absence" : "Late"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
