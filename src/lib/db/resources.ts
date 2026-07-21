import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type DB = SupabaseClient<Database>;
export type Resource = Database["public"]["Tables"]["resources"]["Row"];
export type KitItem = Database["public"]["Tables"]["kit_items"]["Row"];

export async function getSchoolResources(
  db: DB,
  schoolId: string,
): Promise<Resource[]> {
  const { data } = await db
    .from("resources")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getSchoolKitItems(
  db: DB,
  schoolId: string,
): Promise<KitItem[]> {
  const { data } = await db
    .from("kit_items")
    .select("*")
    .eq("school_id", schoolId)
    .order("sort_order");
  return data ?? [];
}
