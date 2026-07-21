import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { School } from "./types";

type DB = SupabaseClient<Database>;

export async function getAllSchools(db: DB): Promise<School[]> {
  const { data } = await db.from("schools").select("*").order("created_at");
  return data ?? [];
}

export async function getSchoolById(
  db: DB,
  id: string,
): Promise<School | null> {
  const { data } = await db.from("schools").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export type SchoolStats = {
  school_id: string;
  student_count: number;
  staff_count: number;
  class_count: number;
  notice_count: number;
};

export async function getPlatformStats(db: DB): Promise<SchoolStats[]> {
  const { data } = await db.rpc("platform_stats");
  return (data ?? []) as SchoolStats[];
}

export async function getSchoolStats(
  db: DB,
  schoolId: string,
): Promise<SchoolStats> {
  const all = await getPlatformStats(db);
  return (
    all.find((s) => s.school_id === schoolId) ?? {
      school_id: schoolId,
      student_count: 0,
      staff_count: 0,
      class_count: 0,
      notice_count: 0,
    }
  );
}
