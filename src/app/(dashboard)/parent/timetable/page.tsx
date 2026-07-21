import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getTimetable } from "@/lib/db/operations";
import type { TimetablePeriod } from "@/lib/db/types";
import { ParentTimetableClient } from "./ParentTimetableClient";

export default async function ParentTimetablePage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  const children = await getStudentsForParent(supabase!, user.id);

  const periodsByChild: Record<string, TimetablePeriod[]> = {};
  await Promise.all(
    children.map(async (c) => {
      periodsByChild[c.id] = c.class_id
        ? await getTimetable(supabase!, c.class_id)
        : [];
    }),
  );

  const { data: subjects } = await supabase!.from("subjects").select("id,name");
  const subjectNames: Record<string, string> = {};
  (subjects ?? []).forEach((s) => {
    subjectNames[s.id] = s.name;
  });

  return (
    <ParentTimetableClient
      childrenList={children}
      periodsByChild={periodsByChild}
      subjectNames={subjectNames}
    />
  );
}
