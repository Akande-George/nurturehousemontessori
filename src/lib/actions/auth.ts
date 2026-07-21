"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin";
import { sendOtpCode } from "@/lib/email/notifications";
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

export async function requestOtp(email: string): Promise<ActionResult> {
  const cleaned = email.trim().toLowerCase();
  if (!cleaned) return { error: "Enter your email address." };

  // Generate the OTP ourselves (admin API) and deliver it via Resend, so
  // sign-in never depends on Supabase's built-in email/SMTP. This always sends
  // a 6-digit code, never a magic link.
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Auth is not configured." };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: cleaned,
  });
  if (error) {
    if (/not found|no user|does not exist/i.test(error.message)) {
      return {
        error: "No account found for that email. Ask your school for an invite.",
      };
    }
    return { error: error.message };
  }

  const code = data.properties?.email_otp;
  if (!code) return { error: "Could not generate a sign-in code. Please try again." };

  const sent = await sendOtpCode(cleaned, code);
  if (!sent.ok) {
    return { error: "We couldn't send your code right now. Please try again shortly." };
  }
  return {};
}

export async function verifyOtp(
  email: string,
  token: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "Auth is not configured." };
  const cleaned = email.trim().toLowerCase();
  const code = token.trim();

  // The code is generated via generateLink({ type: "magiclink" }); depending on
  // the GoTrue version it verifies as either "email" or "magiclink" — try both.
  let { error } = await supabase.auth.verifyOtp({
    email: cleaned,
    token: code,
    type: "email",
  });
  if (error) {
    ({ error } = await supabase.auth.verifyOtp({
      email: cleaned,
      token: code,
      type: "magiclink",
    }));
  }
  if (error) return { error: error.message };
  redirect(await resolveHome(supabase));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
