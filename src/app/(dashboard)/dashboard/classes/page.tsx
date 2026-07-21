import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getClasses } from "@/lib/db/classes";
import { getSchoolStudents } from "@/lib/db/students";
import { ClassesClient } from "./ClassesClient";

export default async function ClassesPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [classes, students, membershipsRes] = await Promise.all([
    getClasses(supabase, school.id),
    getSchoolStudents(supabase, school.id),
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

  const countByClass: Record<string, number> = {};
  for (const s of students) {
    if (s.class_id) countByClass[s.class_id] = (countByClass[s.class_id] ?? 0) + 1;
  }

  return (
    <ClassesClient classes={classes} staff={staff} countByClass={countByClass} />
  );
}
