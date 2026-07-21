import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import {
  getClassById,
  getSubjects,
  getSubjectTeachers,
} from "@/lib/db/classes";
import { getClassStudents } from "@/lib/db/students";
import { ClassDetailClient } from "./ClassDetailClient";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { school } = await requireRole("admin");
  const { classId } = await params;
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const cls = await getClassById(supabase, classId);

  if (!cls || cls.school_id !== school.id) {
    return (
      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Class not found
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              This class may have been removed or the link is incorrect.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/classes">Back to Classes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [students, subjects, assignments, membershipsRes] = await Promise.all([
    getClassStudents(supabase, cls.id),
    getSubjects(supabase, school.id),
    getSubjectTeachers(supabase, cls.id),
    supabase
      .from("memberships")
      .select("user_id, role, profile:profiles(id, full_name)")
      .eq("school_id", school.id)
      .in("role", ["admin", "teacher"]),
  ]);

  const staff = (membershipsRes.data ?? [])
    .map((m) => ({
      id: m.user_id,
      name:
        (m.profile as unknown as { full_name?: string } | null)?.full_name ??
        "Staff",
    }))
    .filter((s) => s.id);

  const assignmentMap: Record<string, string> = {};
  for (const a of assignments) {
    if (a.teacher_id) assignmentMap[a.subject_id] = a.teacher_id;
  }

  return (
    <ClassDetailClient
      cls={cls}
      students={students}
      subjects={subjects}
      staff={staff}
      assignmentMap={assignmentMap}
    />
  );
}
