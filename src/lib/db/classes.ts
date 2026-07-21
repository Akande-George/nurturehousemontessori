import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { SchoolClass, Subject } from "./types";

type DB = SupabaseClient<Database>;

export async function getClasses(
  db: DB,
  schoolId: string,
): Promise<SchoolClass[]> {
  const { data } = await db
    .from("classes")
    .select("*")
    .eq("school_id", schoolId)
    .order("level");
  return data ?? [];
}

export async function getClassById(
  db: DB,
  id: string,
): Promise<SchoolClass | null> {
  const { data } = await db.from("classes").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getSubjects(
  db: DB,
  schoolId: string,
): Promise<Subject[]> {
  const { data } = await db
    .from("subjects")
    .select("*")
    .eq("school_id", schoolId)
    .order("name");
  return data ?? [];
}

export type ClassSubjectTeacher =
  Database["public"]["Tables"]["class_subject_teachers"]["Row"];

export async function getSubjectTeachers(
  db: DB,
  classId: string,
): Promise<ClassSubjectTeacher[]> {
  const { data } = await db
    .from("class_subject_teachers")
    .select("*")
    .eq("class_id", classId);
  return data ?? [];
}

// Classes a teacher is involved with (class teacher OR subject teacher).
export async function getTeacherClasses(
  db: DB,
  teacherId: string,
  schoolId: string,
): Promise<SchoolClass[]> {
  const [own, cst] = await Promise.all([
    db.from("classes").select("*").eq("school_id", schoolId).eq("class_teacher_id", teacherId),
    db.from("class_subject_teachers").select("class_id").eq("teacher_id", teacherId),
  ]);
  const ids = new Set<string>((own.data ?? []).map((c) => c.id));
  (cst.data ?? []).forEach((r) => ids.add(r.class_id));
  if (ids.size === 0) return [];
  const { data } = await db
    .from("classes")
    .select("*")
    .in("id", Array.from(ids))
    .order("level");
  return data ?? [];
}

export async function getTeacherSubjectsForClass(
  db: DB,
  teacherId: string,
  classId: string,
): Promise<Subject[]> {
  const { data: cst } = await db
    .from("class_subject_teachers")
    .select("subject_id")
    .eq("class_id", classId)
    .eq("teacher_id", teacherId);
  const ids = (cst ?? []).map((r) => r.subject_id);
  if (ids.length === 0) return [];
  const { data } = await db.from("subjects").select("*").in("id", ids).order("name");
  return data ?? [];
}
