import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getAfterSchoolEnrollments } from "@/lib/db/operations";
import { ParentAfterSchoolClient } from "./ParentAfterSchoolClient";

export default async function AfterSchoolPage() {
  const { user, school } = await requireRole("parent");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [children, enrollments] = await Promise.all([
    getStudentsForParent(supabase, user.id),
    getAfterSchoolEnrollments(supabase, school.id),
  ]);

  const enrolledIds = enrollments.map((e) => e.student_id);

  return (
    <ParentAfterSchoolClient children={children} enrolledIds={enrolledIds} />
  );
}
