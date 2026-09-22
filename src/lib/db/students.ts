import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Student, SchoolType } from "./types";
import { getTeacherClassrooms } from "./classrooms";

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

// The children a teacher works with. A Montessori teacher who has been assigned
// classrooms sees only those rooms.
//
// A teacher with NO assignment deliberately falls through to the whole-school
// roll — which is what every teacher saw before classrooms existed. Scoping is
// therefore opt-in, and that is a fail-OPEN default: forget to assign a teacher
// and they see the entire school. It is the approved behaviour, chosen so that
// applying the classrooms migration cannot silently blank out the screens of
// staff who have not been assigned yet. The staff list surfaces such teachers
// in amber ("No classroom — sees every child") so the state is visible to the
// admin rather than silent.
//
// To make this deny-by-default instead: return [] when classrooms.length === 0,
// and require an explicit assignment before a teacher sees any child.
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
    if (classrooms.length > 0) {
      const { data } = await db
        .from("students")
        .select("*")
        .eq("school_id", args.schoolId)
        .in("classroom", classrooms)
        .order("name");
      return data ?? [];
    }
  }
  return getSchoolStudents(db, args.schoolId);
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
