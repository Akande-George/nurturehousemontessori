import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { AssessmentScore, Term } from "./types";

type DB = SupabaseClient<Database>;

export async function getScore(
  db: DB,
  studentId: string,
  classId: string,
  subjectId: string,
  term: Term,
): Promise<AssessmentScore | null> {
  const { data } = await db
    .from("assessment_scores")
    .select("*")
    .eq("student_id", studentId)
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .eq("term", term)
    .maybeSingle();
  return data ?? null;
}

export async function getClassScores(
  db: DB,
  classId: string,
  subjectId: string,
  term: Term,
): Promise<AssessmentScore[]> {
  const { data } = await db
    .from("assessment_scores")
    .select("*")
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .eq("term", term);
  return data ?? [];
}
