import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import {
  getStudentHomework,
  type HomeworkWithSubmission,
} from "@/lib/db/homework";
import { ParentHomeworkClient } from "./ParentHomeworkClient";

export default async function ParentHomeworkPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  const children = await getStudentsForParent(supabase!, user.id);

  const homeworkByChild: Record<string, HomeworkWithSubmission[]> = {};
  await Promise.all(
    children.map(async (c) => {
      homeworkByChild[c.id] = await getStudentHomework(
        supabase!,
        c.id,
        c.class_id,
      );
    }),
  );

  const { data: subjects } = await supabase!.from("subjects").select("id,name");
  const subjectNames: Record<string, string> = {};
  (subjects ?? []).forEach((s) => {
    subjectNames[s.id] = s.name;
  });

  return (
    <ParentHomeworkClient
      childrenList={children}
      homeworkByChild={homeworkByChild}
      subjectNames={subjectNames}
    />
  );
}
