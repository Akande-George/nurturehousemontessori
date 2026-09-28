import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolCurriculum } from "@/lib/db/curriculum";
import { CurriculumEditorClient } from "./CurriculumEditorClient";

export default async function CurriculumPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;
  if (school.type === "regular") redirect("/dashboard");

  // The full catalog, hidden items included, so they can be shown again.
  const { all } = await getSchoolCurriculum(supabase, school.id);
  return <CurriculumEditorClient curriculum={all} />;
}
