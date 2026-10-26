import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getTeacherStudents } from "@/lib/db/students";
import { getChildMaterials } from "@/lib/db/childMaterials";
import { ChildMaterialsClient } from "./ChildMaterialsClient";

export default async function TeacherChildMaterialsPage() {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return <ChildMaterialsClient students={[]} materials={[]} />;
  }

  // Deny by default: a teacher only ever shares with the children they are
  // assigned, so the roster here is also the whole scope of the page.
  const students = await getTeacherStudents(supabase, {
    teacherId: user.id,
    schoolId: school.id,
    schoolType: school.type,
  });
  const materials = await getChildMaterials(
    supabase,
    students.map((s) => s.id),
  );

  return (
    <ChildMaterialsClient
      students={students.map((s) => ({
        id: s.id,
        name: s.name,
        avatar_color: s.avatar_color,
      }))}
      materials={materials.map((m) => ({
        id: m.id,
        studentId: m.student_id,
        title: m.title,
        description: m.description,
        category: m.category,
        fileName: m.file_name,
        fileExt: m.file_ext,
        fileSizeBytes: m.file_size_bytes,
        createdAt: m.created_at,
      }))}
    />
  );
}
