import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { CURRICULUM } from "@/lib/curriculum/curriculum";
import {
  buildSchoolCurriculum,
  type CurriculumNodeRow,
  type SchoolCurriculum,
} from "@/lib/curriculum/school-curriculum";

type DB = SupabaseClient<Database>;

// A school's overlay rows on the built-in album. A failed read (e.g. the
// curriculum_nodes migration hasn't been applied yet) yields [], which merges
// to the plain built-in catalog — so nothing downstream breaks.
export async function getCurriculumNodes(
  db: DB,
  schoolId: string,
): Promise<CurriculumNodeRow[]> {
  const { data, error } = await db
    .from("curriculum_nodes")
    .select("node_id, kind, parent_node_id, name, description, hidden, sort_order, created_at")
    .eq("school_id", schoolId)
    .order("created_at");
  if (error) return [];
  return data ?? [];
}

/** The school's merged catalog: `visible` for pickers/stats, `all` for lookups. */
export async function getSchoolCurriculum(
  db: DB,
  schoolId: string,
): Promise<SchoolCurriculum> {
  return buildSchoolCurriculum(CURRICULUM, await getCurriculumNodes(db, schoolId));
}

/**
 * Full catalogs (`all`) for several schools at once — used where rows are
 * enriched with their leaf and the caller didn't pass a catalog.
 */
export async function getCatalogsForSchools(
  db: DB,
  schoolIds: string[],
): Promise<Map<string, SchoolCurriculum>> {
  const unique = [...new Set(schoolIds)];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await getSchoolCurriculum(db, id)] as const),
  );
  return new Map(entries);
}
