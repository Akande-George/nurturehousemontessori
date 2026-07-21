import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import { getAfterSchoolEnrollments } from "@/lib/db/operations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users } from "lucide-react";

export default async function AdminAfterSchoolPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [students, enrollments] = await Promise.all([
    getSchoolStudents(supabase, school.id),
    getAfterSchoolEnrollments(supabase, school.id),
  ]);

  const enrolledIds = new Set(enrollments.map((e) => e.student_id));
  const enrolledStudents = students.filter((s) => enrolledIds.has(s.id));
  const latePickupStudents = students.filter((s) => s.frequent_late_pickup);
  const unenrolledLatePickup = latePickupStudents.filter(
    (s) => !enrolledIds.has(s.id),
  );

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("");

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">After School Care</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enrolled students and families who may benefit from the programme.
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
              {enrolledStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${student.avatar_color} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                  >
                    {initials(student.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">
                      {student.classroom ?? ""}
                    </p>
                  </div>
                  <Badge className="bg-emerald-50 border-emerald-200 border text-emerald-700 hover:bg-emerald-50">
                    Enrolled
                  </Badge>
                </div>
              ))}
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
              school hours but haven&apos;t enrolled in the After School Care
              programme. Consider reaching out.
            </p>
            <div className="space-y-2">
              {unenrolledLatePickup.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/40 p-3"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${student.avatar_color} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                  >
                    {initials(student.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">
                      {student.classroom ?? ""}
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
