import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getTeacherStudents } from "@/lib/db/students";
import { BulkObservationClient } from "./BulkObservationClient";

export default async function BulkObservationPage() {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();

  // Only the children this teacher is assigned to can be picked.
  const students =
    supabase && school
      ? await getTeacherStudents(supabase, {
          teacherId: user.id,
          schoolId: school.id,
          schoolType: school.type,
        })
      : [];

  return <BulkObservationClient students={students} />;
}
