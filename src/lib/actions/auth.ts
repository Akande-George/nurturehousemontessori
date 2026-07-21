"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { homeForRole } from "@/lib/auth/routes";
import type { SupabaseClient } from "@supabase/supabase-js";

type ActionResult = { error?: string };

// Resolve where a freshly-signed-in user should land, using the same client that
// holds the new session (avoids stale-cookie reads in a server action).
async function resolveHome(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/login";
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();
  if (profile?.is_platform_admin) return "/super-admin";
  const { data: m } = await supabase
    .from("memberships")
    .select("role, school:schools(type)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!m) return "/login";
  const schoolType = (m.school as { type?: "montessori" | "regular" } | null)?.type ?? null;
  return homeForRole(m.role, schoolType);
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "Auth is not configured." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect(await resolveHome(supabase));
}

export async function requestOtp(email: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "Auth is not configured." };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) return { error: error.message };
  return {};
}

export async function verifyOtp(
  email: string,
  token: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "Auth is not configured." };
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) return { error: error.message };
  redirect(await resolveHome(supabase));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
