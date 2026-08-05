"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/context";
import { createAdminClient } from "@/supabase/admin";
import { sendParentPortalInvite } from "@/lib/email/notifications";
import { linkParentToStudent } from "@/lib/server/link-parent";

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
  if (!input.email.trim()) return { ok: false, error: "Enter the parent's email." };
  if (!input.studentId) return { ok: false, error: "Choose a child to link." };

  // The student must belong to this school.
  const admin = createAdminClient();
  const { data: student } = await admin
    .from("students")
    .select("id,school_id")
    .eq("id", input.studentId)
    .single();
  if (!student || student.school_id !== school.id) {
    return { ok: false, error: "Student not found in your school." };
  }

  const res = await linkParentToStudent({
    schoolId: school.id,
    schoolName: school.name,
    studentId: student.id,
    email: input.email,
    name: input.parentName,
    invitedBy: user.id,
  });
  if (!res.ok) return res;

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
