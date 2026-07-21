import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getClasses } from "@/lib/db/classes";
import { getSchoolStudents } from "@/lib/db/students";
import { PromotionClient } from "./PromotionClient";

export default async function PromotionPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [classes, students] = await Promise.all([
    getClasses(supabase, school.id),
    getSchoolStudents(supabase, school.id),
  ]);

  const countByClass: Record<string, number> = {};
  for (const s of students) {
    if (s.class_id) countByClass[s.class_id] = (countByClass[s.class_id] ?? 0) + 1;
  }

  return <PromotionClient classes={classes} countByClass={countByClass} />;
}
