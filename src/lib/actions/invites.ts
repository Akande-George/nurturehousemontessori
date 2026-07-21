"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/context";
import { createAdminClient } from "@/supabase/admin";
import { sendParentPortalInvite } from "@/lib/email/notifications";

type Result = { ok: boolean; error?: string };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Grant a family portal access: ensure their auth account + parent membership +
// link to the child, record the invitation, and email them a sign-in link.
export async function inviteParent(input: {
  email: string;
  studentId: string;
  parentName?: string;
}): Promise<Result> {
  const { school, user } = await requireRole("admin");
  if (!school) return { ok: false, error: "No school context." };
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "Enter the parent's email." };
  if (!input.studentId) return { ok: false, error: "Choose a child to link." };

  const admin = createAdminClient();

  // 1. The student must belong to this school.
  const { data: student } = await admin
    .from("students")
    .select("id,name,school_id")
    .eq("id", input.studentId)
    .single();
  if (!student || student.school_id !== school.id) {
    return { ok: false, error: "Student not found in your school." };
  }

  // 2. Find or create the parent's auth account (OTP sign-in, no password).
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let parent = list?.users?.find((u) => u.email?.toLowerCase() === email);
  if (!parent) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: input.parentName?.trim() || "" },
    });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "Could not create the account." };
    }
    parent = data.user;
  } else if (input.parentName?.trim()) {
    // Backfill the name if we now have one and the profile is blank.
    await admin
      .from("profiles")
      .update({ full_name: input.parentName.trim() })
      .eq("id", parent.id)
      .is("full_name", null);
  }

  // 3. Parent membership for this school.
  const { error: mErr } = await admin
    .from("memberships")
    .upsert(
      { user_id: parent.id, school_id: school.id, role: "parent" },
      { onConflict: "user_id,school_id" },
    );
  if (mErr) return { ok: false, error: mErr.message };

  // 4. Link the parent to the child.
  const { error: spErr } = await admin
    .from("student_parents")
    .upsert(
      { student_id: student.id, parent_id: parent.id },
      { onConflict: "student_id,parent_id" },
    );
  if (spErr) return { ok: false, error: spErr.message };

  // 5. Record the invitation.
  await admin.from("invitations").insert({
    school_id: school.id,
    email,
    role: "parent",
    student_id: student.id,
    token: crypto.randomUUID(),
    status: "pending",
    invited_by: user.id,
  });

  // 6. Email the sign-in link (best-effort).
  await sendParentPortalInvite(email, school.name, `${APP_URL}/login`);

  revalidatePath("/dashboard/invites");
  return { ok: true };
}

// Re-send the portal sign-in email to an already-invited family.
export async function resendParentInvite(email: string): Promise<Result> {
  const { school } = await requireRole("admin");
  if (!school) return { ok: false, error: "No school context." };
  const clean = email.trim().toLowerCase();
  if (!clean) return { ok: false, error: "Missing email." };
  await sendParentPortalInvite(clean, school.name, `${APP_URL}/login`);
  return { ok: true };
}
