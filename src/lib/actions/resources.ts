"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";

type Result = { ok: boolean; error?: string };

export async function createResource(input: {
  title: string;
  description?: string;
  type: "article" | "video" | "policy";
  url?: string;
}): Promise<Result> {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("resources").insert({
    school_id: ctx.school.id,
    title: input.title,
    description: input.description ?? null,
    type: input.type,
    url: input.url ?? null,
    created_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/resources");
  revalidatePath("/parent/resources");
  return { ok: true };
}

export async function deleteResource(id: string): Promise<Result> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/resources");
  revalidatePath("/parent/resources");
  return { ok: true };
}
