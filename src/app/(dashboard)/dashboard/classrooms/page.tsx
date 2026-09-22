import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getClassrooms } from "@/lib/db/classrooms";
import { getSchoolStudents } from "@/lib/db/students";
import { ClassroomsClient } from "./ClassroomsClient";

export default async function ClassroomsPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [classrooms, students] = await Promise.all([
    getClassrooms(supabase, school.id),
    getSchoolStudents(supabase, school.id),
  ]);

  const countByRoom: Record<string, number> = {};
  for (const s of students) {
    if (s.classroom) countByRoom[s.classroom] = (countByRoom[s.classroom] ?? 0) + 1;
  }

  return (
    <ClassroomsClient classrooms={classrooms} countByRoom={countByRoom} />
  );
}
