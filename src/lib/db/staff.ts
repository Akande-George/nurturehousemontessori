import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Admin-only staff directory. Uses the service-role client so it can read every
// staff member's profile + auth sign-in status for the school.
type DB = SupabaseClient<Database>;

export type StaffRole = "admin" | "teacher";

export type StaffMember = {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
  status: "active" | "invited";
};

export async function getSchoolStaff(
  admin: DB,
  schoolId: string,
): Promise<StaffMember[]> {
  const { data: memberships } = await admin
    .from("memberships")
    .select("user_id, role")
    .eq("school_id", schoolId)
    .in("role", ["admin", "teacher"]);
  const rows = memberships ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((m) => m.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: userList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const signInMap = new Map(
    (userList?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]),
  );

  return rows
    .map((m) => {
      const p = profileMap.get(m.user_id);
      return {
        userId: m.user_id,
        name: p?.full_name || p?.email || "Staff member",
        email: p?.email ?? "",
        role: m.role as StaffRole,
        status: signInMap.get(m.user_id) ? ("active" as const) : ("invited" as const),
      };
    })
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}
