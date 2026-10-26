import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type DB = SupabaseClient<Database>;

export type ChildMaterial =
  Database["public"]["Tables"]["child_materials"]["Row"];

/**
 * Every material shared with a set of children, newest first.
 *
 * RLS does the gatekeeping: staff see their whole school, a parent sees only
 * the children they are linked to. Passing ids a parent doesn't own returns
 * nothing rather than erroring.
 */
export async function getChildMaterials(
  db: DB,
  studentIds: string[],
): Promise<ChildMaterial[]> {
  if (studentIds.length === 0) return [];
  const { data } = await db
    .from("child_materials")
    .select("*")
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getSchoolChildMaterials(
  db: DB,
  schoolId: string,
): Promise<ChildMaterial[]> {
  const { data } = await db
    .from("child_materials")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Null when the row doesn't exist OR the caller may not read it (RLS). */
export async function getChildMaterialById(
  db: DB,
  id: string,
): Promise<ChildMaterial | null> {
  const { data } = await db
    .from("child_materials")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

/** Materials shared in a date window — used by the progress report snapshot. */
export async function getStudentChildMaterialsRange(
  db: DB,
  studentId: string,
  from: string,
  to: string,
): Promise<ChildMaterial[]> {
  const { data } = await db
    .from("child_materials")
    .select("*")
    .eq("student_id", studentId)
    .gte("created_at", `${from}T00:00:00.000Z`)
    .lte("created_at", `${to}T23:59:59.999Z`)
    .order("created_at", { ascending: false });
  return data ?? [];
}
