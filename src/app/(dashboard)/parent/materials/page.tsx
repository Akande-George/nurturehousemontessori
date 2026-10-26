import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getChildMaterials } from "@/lib/db/childMaterials";
import { ParentMaterialsClient } from "./ParentMaterialsClient";

export default async function ParentChildMaterialsPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  if (!supabase) {
    return <ParentMaterialsClient childrenList={[]} materials={[]} />;
  }

  const childrenList = await getStudentsForParent(supabase, user.id);
  // RLS restricts child_materials to this parent's own children.
  const materials = await getChildMaterials(
    supabase,
    childrenList.map((c) => c.id),
  );

  return (
    <ParentMaterialsClient
      childrenList={childrenList.map((c) => ({
        id: c.id,
        name: c.name,
        avatar_color: c.avatar_color,
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
