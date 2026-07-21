import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSubjects } from "@/lib/db/classes";
import { SubjectsClient } from "./SubjectsClient";

export default async function SubjectsPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const subjects = await getSubjects(supabase, school.id);
  return <SubjectsClient subjects={subjects} />;
}
