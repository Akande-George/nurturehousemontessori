import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Classroom } from "./types";

type DB = SupabaseClient<Database>;

// Classrooms a Montessori school maintains: a name plus an editable age-group
// label. Regular schools use the `classes` table instead; Montessori schools
// have no rows there, so a child's room is the text in students.classroom —
// matched by name against these rows.
export async function getClassrooms(
  db: DB,
  schoolId: string,
): Promise<Classroom[]> {
  const { data } = await db
    .from("classrooms")
    .select("*")
    .eq("school_id", schoolId)
    .order("sort_order")
    .order("name");
  return data ?? [];
}

// The classrooms one teacher is assigned to, as names.
export async function getTeacherClassrooms(
  db: DB,
  teacherId: string,
  schoolId: string,
): Promise<string[]> {
  const { data } = await db
    .from("teacher_classroom_assignments")
    .select("classroom")
    .eq("teacher_id", teacherId)
    .eq("school_id", schoolId)
    .order("classroom");
  return (data ?? []).map((r) => r.classroom);
}

// Every teacher's classrooms for a school, keyed by user id — one query for the
// whole staff list rather than one per teacher.
export async function getSchoolTeacherClassrooms(
  db: DB,
  schoolId: string,
): Promise<Record<string, string[]>> {
  const { data } = await db
    .from("teacher_classroom_assignments")
    .select("teacher_id, classroom")
    .eq("school_id", schoolId)
    .order("classroom");
  const byTeacher: Record<string, string[]> = {};
  for (const row of data ?? []) {
    (byTeacher[row.teacher_id] ??= []).push(row.classroom);
  }
  return byTeacher;
}
