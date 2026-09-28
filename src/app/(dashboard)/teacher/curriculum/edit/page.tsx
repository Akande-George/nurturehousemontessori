import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolCurriculum } from "@/lib/db/curriculum";
import { CurriculumEditorClient } from "../../../dashboard/curriculum/CurriculumEditorClient";

// Teachers add to and rename the school's curriculum; hiding and deleting stay
// with admins (the editor hides those controls, the actions enforce it).
export default async function TeacherCurriculumEditPage() {
  const { school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) return null;
  if (school.type === "regular") redirect("/teacher");

  const { visible } = await getSchoolCurriculum(supabase, school.id);
  return (
    <CurriculumEditorClient
      curriculum={visible}
      canManage={false}
      backHref="/teacher/curriculum"
    />
  );
}
