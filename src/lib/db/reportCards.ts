import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { ReportCard, ReportCardRow, Term } from "./types";

type DB = SupabaseClient<Database>;

export async function getStudentReportCards(
  db: DB,
  studentId: string,
): Promise<ReportCard[]> {
  const { data } = await db
    .from("report_cards")
    .select("*")
    .eq("student_id", studentId)
    .order("published_at", { ascending: false });
  return data ?? [];
}

export type ReportCardWithRows = ReportCard & { rows: ReportCardRow[] };

export async function getReportCardById(
  db: DB,
  id: string,
): Promise<ReportCardWithRows | null> {
  const { data: card } = await db
    .from("report_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!card) return null;
  const { data: rows } = await db
    .from("report_card_rows")
    .select("*")
    .eq("report_card_id", id);
  return { ...card, rows: rows ?? [] };
}

export async function getReportCard(
  db: DB,
  studentId: string,
  classId: string,
  term: Term,
): Promise<ReportCard | null> {
  const { data } = await db
    .from("report_cards")
    .select("*")
    .eq("student_id", studentId)
    .eq("class_id", classId)
    .eq("term", term)
    .maybeSingle();
  return data ?? null;
}

export type ComputedRow = {
  student_id: string;
  subject_id: string;
  ca_total: number;
  exam_score: number;
  total: number;
  grade: string;
  remark: string;
  subject_position: number;
  overall_total: number;
  overall_average: number;
  overall_grade: string;
  overall_position: number;
  class_size: number;
  promotion_status: "promoted" | "repeated" | "pending";
};

// Live class-ranked computation (window functions in Postgres).
export async function computeClassReportCards(
  db: DB,
  classId: string,
  term: Term,
  year: string,
): Promise<ComputedRow[]> {
  const { data } = await db.rpc("compute_report_card", {
    p_class_id: classId,
    p_term: term,
    p_year: year,
  });
  return (data ?? []) as ComputedRow[];
}
