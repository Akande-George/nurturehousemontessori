import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Homework, HomeworkSubmission } from "./types";

type DB = SupabaseClient<Database>;

export async function getClassHomework(
  db: DB,
  classId: string,
): Promise<Homework[]> {
  const { data } = await db
    .from("homework")
    .select("*")
    .eq("class_id", classId)
    .order("due_date", { ascending: false });
  return data ?? [];
}

export type HomeworkWithSubmission = Homework & {
  submission: HomeworkSubmission | null;
};

export async function getStudentHomework(
  db: DB,
  studentId: string,
  classId: string | null,
): Promise<HomeworkWithSubmission[]> {
  if (!classId) return [];
  const homework = await getClassHomework(db, classId);
  if (homework.length === 0) return [];
  const { data: subs } = await db
    .from("homework_submissions")
    .select("*")
    .eq("student_id", studentId)
    .in(
      "homework_id",
      homework.map((h) => h.id),
    );
  const byHw = new Map((subs ?? []).map((s) => [s.homework_id, s]));
  return homework.map((h) => ({ ...h, submission: byHw.get(h.id) ?? null }));
}
