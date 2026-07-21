// Create or promote the platform super-admin (idempotent, non-destructive).
// The account signs in via email OTP — no password is stored.
//
// Usage:
//   SUPER_ADMIN_EMAIL=you@example.com node --env-file=.env.local scripts/bootstrap-super-admin.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from .env.local).
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SUPER_ADMIN_EMAIL;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!email) {
  console.error("Set SUPER_ADMIN_EMAIL=you@example.com");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
let user = list.users.find((u) => u.email === email);

if (!user) {
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: "Platform Admin", is_platform_admin: true },
  });
  if (error) throw new Error("createUser: " + error.message);
  user = data.user;
  console.log("Created super-admin:", email, user.id);
} else {
  console.log("User already exists:", email, user.id);
}

const { error: pErr } = await db
  .from("profiles")
  .update({ is_platform_admin: true })
  .eq("id", user.id);
if (pErr) throw new Error("profile update: " + pErr.message);

console.log("✅ %s is now the platform super-admin. Log in via email OTP.", email);
