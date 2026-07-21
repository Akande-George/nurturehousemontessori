import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users } from "lucide-react";

export default async function ClassAssignmentsPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [students, membershipsRes] = await Promise.all([
    getSchoolStudents(supabase, school.id),
    supabase
      .from("memberships")
      .select("user_id, role, profile:profiles(full_name)")
      .eq("school_id", school.id)
      .in("role", ["admin", "teacher"]),
  ]);

  const staff = (membershipsRes.data ?? [])
    .map((m) => ({
      id: m.user_id,
      role: m.role,
      name:
        (m.profile as unknown as { full_name?: string } | null)?.full_name ??
        "Staff",
    }))
    .filter((s) => s.id);

  // Group students by classroom
  const byClassroom = new Map<string, typeof students>();
  for (const s of students) {
    const key = s.classroom ?? "Unassigned";
    if (!byClassroom.has(key)) byClassroom.set(key, []);
    byClassroom.get(key)!.push(s);
  }
  const classrooms = [...byClassroom.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("");

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">Class Assignments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Every classroom, the children enrolled in it, and the school&apos;s
          teaching team.
        </p>
      </div>

      {/* Staff directory */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-montessori-primary" />
            Teaching Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              No teachers or administrators yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {staff.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-700"
                >
                  {s.name}
                  <Badge
                    variant="secondary"
                    className="bg-slate-200 text-slate-600 border-none capitalize text-[10px]"
                  >
                    {s.role}
                  </Badge>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classrooms */}
      {classrooms.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            No students enrolled yet.
          </CardContent>
        </Card>
      ) : (
        classrooms.map(([classroom, roster]) => (
          <Card key={classroom} className="border-slate-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-montessori-primary" />
                  {classroom}
                </CardTitle>
                <Badge variant="outline" className="bg-white">
                  {roster.length} student{roster.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {roster.map((student) => (
                  <span
                    key={student.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium"
                  >
                    <span
                      className={`w-6 h-6 rounded-full ${student.avatar_color} text-white flex items-center justify-center text-[10px] font-bold`}
                    >
                      {initials(student.name)}
                    </span>
                    {student.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
