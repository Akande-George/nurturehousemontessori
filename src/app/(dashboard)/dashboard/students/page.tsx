import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getClasses } from "@/lib/db/classes";
import { getSchoolStudents } from "@/lib/db/students";
import { StudentsClient } from "./StudentsClient";

export default async function StudentsPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [students, classes] = await Promise.all([
    getSchoolStudents(supabase, school.id),
    getClasses(supabase, school.id),
  ]);

  const classNames: Record<string, string> = {};
  for (const c of classes) classNames[c.id] = c.name;

  return (
    <StudentsClient
      students={students}
      classes={classes}
      classNames={classNames}
      schoolType={school.type}
    />
  );
}
