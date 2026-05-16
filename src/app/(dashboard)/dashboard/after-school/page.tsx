"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getFrequentLatePickupStudents,
  getAfterSchoolEnrollments,
  isAfterSchoolEnrolled,
  useDemoStore,
  getDemoSnapshot,
} from "@/lib/mock/demo-store";
import { Clock, Star, Users } from "lucide-react";

export default function AdminAfterSchoolPage() {
  useDemoStore();

  const enrollments = getAfterSchoolEnrollments();
  const latePickupStudents = getFrequentLatePickupStudents();
  const state = getDemoSnapshot();

  const enrolledStudents = useMemo(
    () => state.students.filter((s) => isAfterSchoolEnrolled(s.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enrollments, state.students],
  );

  const unenrolledLatePickup = latePickupStudents.filter(
    (s) => !isAfterSchoolEnrolled(s.id),
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">
          After School Care
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage enrolled students and flag parents who may benefit from the
          programme.
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Enrolled
            </p>
            <p className="text-3xl font-serif text-slate-900 mt-2">
              {enrolledStudents.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Frequent Late Pickup
            </p>
            <p className="text-3xl font-serif text-slate-900 mt-2">
              {latePickupStudents.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Not Enrolled but Late
            </p>
            <p className="text-3xl font-serif text-amber-600 mt-2">
              {unenrolledLatePickup.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled students list */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Enrolled Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrolledStudents.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">
              No students currently enrolled.
            </p>
          ) : (
            <div className="space-y-2">
              {enrolledStudents.map((student) => {
                const enrollment = enrollments.find(
                  (e) => e.studentId === student.id,
                );
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                  >
                    <div
                      className={`w-9 h-9 rounded-full ${student.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                    >
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {student.classroom} · {student.ageGroup}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className="bg-emerald-50 border-emerald-200 border text-emerald-700 hover:bg-emerald-50">
                        Enrolled
                      </Badge>
                      {enrollment && (
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5 justify-end">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(enrollment.enrolledAt).toLocaleDateString(
                            "en-NG",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unenrolled frequent late pickup */}
      {unenrolledLatePickup.length > 0 && (
        <Card className="border-amber-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Star className="w-4 h-4 text-amber-500" />
              Recommended for After School Care
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              These families are frequently picking up their children after
              school hours but haven't enrolled in the After School Care
              programme. Consider reaching out.
            </p>
            <div className="space-y-2">
              {unenrolledLatePickup.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/40 p-3"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${student.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                  >
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">
                      {student.classroom} · Parent: {student.parentName}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-amber-300 text-amber-700 bg-amber-50 shrink-0"
                  >
                    Late pickup
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
