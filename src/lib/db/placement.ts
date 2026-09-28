import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type DB = SupabaseClient<Database>;

// Put Montessori children in the room that fits their age (and refresh their
// age band) — one child, one school, or both unset for every school. Returns
// how many moved. Best-effort: before the age-placement migration is applied
// the RPC doesn't exist, and children simply stay where they are.
export async function placeByAge(
  db: DB,
  scope: { schoolId?: string; studentId?: string },
): Promise<number> {
  const { data } = await db.rpc("place_students_by_age", {
    p_school: scope.schoolId,
    p_student: scope.studentId,
  });
  return typeof data === "number" ? data : 0;
}
