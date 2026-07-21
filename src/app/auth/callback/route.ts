import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/supabase/server";
import { homeForRole } from "@/lib/auth/routes";

// Handles magic-link / invite / OTP-link callbacks: exchanges the code for a
// session cookie, then routes the user to their role's home.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const supabase = await createClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next) return NextResponse.redirect(`${origin}${next}`);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_platform_admin")
          .eq("id", user.id)
          .single();
        if (profile?.is_platform_admin) {
          return NextResponse.redirect(`${origin}/super-admin`);
        }
        const { data: m } = await supabase
          .from("memberships")
          .select("role, school:schools(type)")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (m) {
          const schoolType =
            (m.school as { type?: "montessori" | "regular" } | null)?.type ??
            null;
          return NextResponse.redirect(
            `${origin}${homeForRole(m.role, schoolType)}`,
          );
        }
      }
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
