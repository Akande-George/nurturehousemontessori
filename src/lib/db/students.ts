import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Student, SchoolType } from "./types";
import { getTeacherClassrooms } from "./classrooms";
import { getTeacherClasses } from "./classes";

type DB = SupabaseClient<Database>;

export async function getStudentsForParent(
  db: DB,
  parentId: string,
): Promise<Student[]> {
  const { data } = await db
    .from("student_parents")
    .select("student:students(*)")
    .eq("parent_id", parentId);
  return (data ?? [])
    .map((r) => r.student as unknown as Student)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type StudentParent = { id: string; fullName: string; email: string };

// Every parent account linked to one child — a child may have several.
export async function getStudentParents(
  db: DB,
  studentId: string,
): Promise<StudentParent[]> {
  const { data } = await db
    .from("student_parents")
    .select("parent:profiles(id,full_name,email)")
    .eq("student_id", studentId);
  return (data ?? [])
    .map((r) => r.parent as { id: string; full_name: string | null; email: string | null } | null)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ id: p.id, fullName: p.full_name ?? "", email: p.email ?? "" }))
    .sort((a, b) => (a.fullName || a.email).localeCompare(b.fullName || b.email));
}

export async function getStudentById(
  db: DB,
  id: string,
): Promise<Student | null> {
  const { data } = await db.from("students").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getClassStudents(
  db: DB,
  classId: string,
): Promise<Student[]> {
  const { data } = await db
    .from("students")
    .select("*")
    .eq("class_id", classId)
    .order("name");
  return data ?? [];
}

export async function getSchoolStudents(
  db: DB,
  schoolId: string,
): Promise<Student[]> {
  const { data } = await db
    .from("students")
    .select("*")
    .eq("school_id", schoolId)
    .order("name");
  return data ?? [];
}

// The children a teacher works with — and only those. Deny by default: a
// teacher sees children solely through an assignment, so with none they see
// nobody at all.
//
//   Montessori  -> the classrooms assigned to them (teacher_classroom_assignments)
//   regular     -> the classes they teach (class teacher or subject teacher)
//
// The admin-facing staff list flags teachers with no classroom in amber so the
// gap is visible rather than silent. Whatever this rule says, recordAttendance
// enforces the same scope — keep the two in step.
export async function getTeacherStudents(
  db: DB,
  args: { teacherId: string; schoolId: string; schoolType: SchoolType },
): Promise<Student[]> {
  if (args.schoolType === "montessori") {
    const classrooms = await getTeacherClassrooms(
      db,
      args.teacherId,
      args.schoolId,
    );
    if (classrooms.length === 0) return [];
    const { data } = await db
      .from("students")
      .select("*")
      .eq("school_id", args.schoolId)
      .in("classroom", classrooms)
      .order("name");
    return data ?? [];
  }

  const classes = await getTeacherClasses(db, args.teacherId, args.schoolId);
  if (classes.length === 0) return [];
  const rosters = await Promise.all(
    classes.map((c) => getClassStudents(db, c.id)),
  );
  const byId = new Map<string, Student>();
  for (const roster of rosters) for (const s of roster) byId.set(s.id, s);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type Medication =
  Database["public"]["Tables"]["student_medications"]["Row"];

export async function getStudentMedications(
  db: DB,
  studentId: string,
): Promise<Medication[]> {
  const { data } = await db
    .from("student_medications")
    .select("*")
    .eq("student_id", studentId);
  return data ?? [];
}
