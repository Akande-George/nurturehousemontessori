"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";

type Result = { ok: boolean; error?: string };

export async function addKitItem(input: {
  sectionKey: string;
  name: string;
  required: boolean;
}): Promise<Result> {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("kit_items").insert({
    school_id: ctx.school.id,
    section_key: input.sectionKey,
    name: input.name,
    required: input.required,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/kits");
  return { ok: true };
}

export async function removeKitItem(id: string): Promise<Result> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const { error } = await supabase.from("kit_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/kits");
  return { ok: true };
}

export async function toggleKitItemRequired(
  id: string,
  required: boolean,
): Promise<Result> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const { error } = await supabase
    .from("kit_items")
    .update({ required })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/kits");
  return { ok: true };
}

// Bulk-insert a default checklist for a section (used by the "Load default list"
// button when a section is empty).
export async function seedDefaultKitItems(input: {
  sectionKey: string;
  items: { name: string; required: boolean }[];
}): Promise<Result> {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const rows = input.items.map((it, i) => ({
    school_id: ctx.school!.id,
    section_key: input.sectionKey,
    name: it.name,
    required: it.required,
    sort_order: i,
  }));
  const { error } = await supabase.from("kit_items").insert(rows);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/kits");
  return { ok: true };
}
