"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/context";
import { createAdminClient } from "@/supabase/admin";
import { sendStaffInvite } from "@/lib/email/notifications";

type Result = { ok: boolean; error?: string };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ROLE_LABEL: Record<"admin" | "teacher", string> = {
  admin: "an administrator",
  teacher: "a teacher",
};

// Grant a staff member (teacher or admin) access to this school: ensure their
// account + membership, then email them a sign-in link.
export async function inviteStaff(input: {
  email: string;
  name?: string;
  role: "admin" | "teacher";
}): Promise<Result> {
  const { school } = await requireRole("admin");
  if (!school) return { ok: false, error: "No school context." };
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "Enter the staff member's email." };
  if (input.role !== "admin" && input.role !== "teacher") {
    return { ok: false, error: "Choose a valid role." };
  }

  const admin = createAdminClient();

  // Find or create the auth account (passwordless — OTP sign-in).
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let user = list?.users?.find((u) => u.email?.toLowerCase() === email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: input.name?.trim() || "" },
    });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "Could not create the account." };
    }
    user = data.user;
  } else if (input.name?.trim()) {
    await admin
      .from("profiles")
      .update({ full_name: input.name.trim() })
      .eq("id", user.id)
      .is("full_name", null);
  }

  // A person can hold only one role per school (unique user_id + school_id).
  const { error: mErr } = await admin
    .from("memberships")
    .upsert(
      { user_id: user.id, school_id: school.id, role: input.role },
      { onConflict: "user_id,school_id" },
    );
  if (mErr) return { ok: false, error: mErr.message };

  await admin.from("invitations").insert({
    school_id: school.id,
    email,
    role: input.role,
    token: crypto.randomUUID(),
    status: "pending",
  });

  await sendStaffInvite(email, school.name, ROLE_LABEL[input.role], `${APP_URL}/login`);

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

// Revoke a staff member's access to this school (removes the membership; the
// account itself is left intact in case they belong to other schools).
export async function removeStaff(userId: string): Promise<Result> {
  const { school, user } = await requireRole("admin");
  if (!school) return { ok: false, error: "No school context." };
  if (userId === user.id) {
    return { ok: false, error: "You can't remove your own access." };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("memberships")
    .delete()
    .eq("user_id", userId)
    .eq("school_id", school.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/settings");
  return { ok: true };
}
