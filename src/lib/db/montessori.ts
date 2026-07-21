import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getLeafById, type Leaf } from "@/lib/curriculum/curriculum";

type DB = SupabaseClient<Database>;

export type Observation = Database["public"]["Tables"]["observations"]["Row"];
export type CurriculumProgress =
  Database["public"]["Tables"]["curriculum_progress"]["Row"];
export type DailyReport = Database["public"]["Tables"]["daily_reports"]["Row"];
export type ActivityPost =
  Database["public"]["Tables"]["activity_posts"]["Row"];
export type Progress = Database["public"]["Tables"]["progress"]["Row"];

export type ObservationWithLeaf = Observation & { leaf: Leaf | null };

// ---- Observations ----
export async function getStudentObservations(
  db: DB,
  studentId: string,
): Promise<ObservationWithLeaf[]> {
  const { data } = await db
    .from("observations")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((o) => ({ ...o, leaf: getLeafById(o.leaf_id) ?? null }));
}

export async function getSchoolObservations(
  db: DB,
  schoolId: string,
): Promise<ObservationWithLeaf[]> {
  const { data } = await db
    .from("observations")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((o) => ({ ...o, leaf: getLeafById(o.leaf_id) ?? null }));
}

// ---- Curriculum progress ----
export type CurriculumProgressWithPractices = CurriculumProgress & {
  practices: { practiced_on: string }[];
};

export async function getStudentCurriculumProgress(
  db: DB,
  studentId: string,
): Promise<CurriculumProgressWithPractices[]> {
  const { data } = await db
    .from("curriculum_progress")
    .select("*, practices:curriculum_practices(practiced_on)")
    .eq("student_id", studentId);
  return (data ?? []) as unknown as CurriculumProgressWithPractices[];
}

// ---- Daily reports ----
export async function getStudentDailyReports(
  db: DB,
  studentIds: string[],
): Promise<DailyReport[]> {
  if (studentIds.length === 0) return [];
  const { data } = await db
    .from("daily_reports")
    .select("*")
    .in("student_id", studentIds)
    .order("report_date", { ascending: false });
  return data ?? [];
}

export async function getDailyReportById(
  db: DB,
  id: string,
): Promise<DailyReport | null> {
  const { data } = await db.from("daily_reports").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getSchoolDailyReports(
  db: DB,
  schoolId: string,
): Promise<DailyReport[]> {
  const { data } = await db
    .from("daily_reports")
    .select("*")
    .eq("school_id", schoolId)
    .order("report_date", { ascending: false });
  return data ?? [];
}

// ---- Activity feed ----
export type ActivityPostWithMeta = ActivityPost & {
  leaf: Leaf | null;
  like_count: number;
  liked_by_me: boolean;
};

export async function getActivityFeed(
  db: DB,
  studentIds: string[],
  parentId: string | null,
): Promise<ActivityPostWithMeta[]> {
  if (studentIds.length === 0) return [];
  const { data: posts } = await db
    .from("activity_posts")
    .select("*, likes:post_likes(parent_id)")
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });
  return (posts ?? []).map((p) => {
    const likes = (p as { likes?: { parent_id: string }[] }).likes ?? [];
    return {
      ...(p as ActivityPost),
      leaf: p.leaf_id ? getLeafById(p.leaf_id) ?? null : null,
      like_count: likes.length,
      liked_by_me: parentId ? likes.some((l) => l.parent_id === parentId) : false,
    };
  });
}

export async function getStudentActivityPosts(
  db: DB,
  studentId: string,
): Promise<ActivityPostWithMeta[]> {
  return getActivityFeed(db, [studentId], null);
}

// ---- Progress ----
export async function getStudentProgress(
  db: DB,
  studentId: string,
): Promise<Progress | null> {
  const { data } = await db
    .from("progress")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();
  return data ?? null;
}
