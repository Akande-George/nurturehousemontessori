import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Uses the service-role client: this is an admin-only roster that must read
// parent profiles + auth sign-in status across the school's families.
type DB = SupabaseClient<Database>;

export type PortalStatus = "active" | "invited" | "pending";

export type PortalRow = {
  key: string;
  parentName: string;
  email: string;
  students: string[];
  status: PortalStatus;
  lastAction: string;
};

export async function getPortalRoster(
  admin: DB,
  schoolId: string,
): Promise<PortalRow[]> {
  // Students in the school.
  const { data: students } = await admin
    .from("students")
    .select("id,name")
    .eq("school_id", schoolId);
  const studentMap = new Map((students ?? []).map((s) => [s.id, s.name]));
  const studentIds = [...studentMap.keys()];

  // Parent links for those students.
  let links: { student_id: string; parent_id: string }[] = [];
  if (studentIds.length) {
    const { data } = await admin
      .from("student_parents")
      .select("student_id,parent_id")
      .in("student_id", studentIds);
    links = data ?? [];
  }
  const parentIds = [...new Set(links.map((l) => l.parent_id))];

  // Parent profiles.
  let profiles: { id: string; full_name: string | null; email: string | null }[] = [];
  if (parentIds.length) {
    const { data } = await admin
      .from("profiles")
      .select("id,full_name,email")
      .in("id", parentIds);
    profiles = data ?? [];
  }
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  // Sign-in status from auth (distinguishes Active from Invited-but-not-signed-in).
  const { data: userList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const signInMap = new Map(
    (userList?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]),
  );

  // Group by parent account.
  const byParent = new Map<string, PortalRow>();
  for (const l of links) {
    const p = profileMap.get(l.parent_id);
    if (!p) continue;
    const studentName = studentMap.get(l.student_id) ?? "—";
    const existing = byParent.get(l.parent_id);
    if (existing) {
      if (!existing.students.includes(studentName)) existing.students.push(studentName);
      continue;
    }
    const signedIn = Boolean(signInMap.get(l.parent_id));
    byParent.set(l.parent_id, {
      key: l.parent_id,
      parentName: p.full_name || p.email || "Parent",
      email: p.email ?? "",
      students: [studentName],
      status: signedIn ? "active" : "invited",
      lastAction: signedIn ? "Portal active" : "Invited — awaiting first sign-in",
    });
  }

  // Pending invitations that don't yet have a linked account.
  const linkedEmails = new Set(
    [...byParent.values()].map((r) => r.email.toLowerCase()),
  );
  const { data: invites } = await admin
    .from("invitations")
    .select("email,student_id,status")
    .eq("school_id", schoolId)
    .eq("role", "parent")
    .eq("status", "pending");
  for (const inv of invites ?? []) {
    if (linkedEmails.has(inv.email.toLowerCase())) continue;
    byParent.set(`inv:${inv.email}`, {
      key: `inv:${inv.email}`,
      parentName: inv.email,
      email: inv.email,
      students: inv.student_id ? [studentMap.get(inv.student_id) ?? "—"] : [],
      status: "pending",
      lastAction: "Invite sent",
    });
  }

  return [...byParent.values()].sort((a, b) =>
    a.parentName.localeCompare(b.parentName),
  );
}
