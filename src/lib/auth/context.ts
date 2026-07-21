import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { homeForRole } from "./routes";
import type { Profile, Role, School } from "@/lib/db/types";

export type ActiveContext = {
  user: Profile;
  role: Role;
  school: School | null; // null for super_admin
};

// Cached per-request so multiple callers (layout, page, actions) share one lookup.
export const getActiveContext = cache(
  async (): Promise<ActiveContext | null> => {
    const supabase = await createClient();
    if (!supabase) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!profile) return null;

    if (profile.is_platform_admin) {
      return { user: profile, role: "super_admin", school: null };
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("role, school:schools(*)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!membership || !membership.school) return null;

    return {
      user: profile,
      role: membership.role,
      school: membership.school as unknown as School,
    };
  },
);

export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const ctx = await getActiveContext();
  return ctx?.user ?? null;
});

/**
 * Assert the caller holds `role`; redirect to /login if unauthenticated or to
 * the caller's own home if their role doesn't match. Returns the context.
 */
export async function requireRole(role: Role): Promise<ActiveContext> {
  const ctx = await getActiveContext();
  if (!ctx) redirect("/login");
  if (ctx.role !== role) redirect(homeForRole(ctx.role, ctx.school?.type));
  return ctx;
}

/** For pages reachable by any authenticated role (rare). */
export async function requireAuth(): Promise<ActiveContext> {
  const ctx = await getActiveContext();
  if (!ctx) redirect("/login");
  return ctx;
}
