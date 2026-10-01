"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/context";
import { createAdminClient } from "@/supabase/admin";
import { sendParentPortalInvite } from "@/lib/email/notifications";
import { linkParentToStudent } from "@/lib/server/link-parent";
import { PORTAL_URL } from "@/lib/site-url";

type Result = { ok: boolean; error?: string };

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
  await sendParentPortalInvite(clean, school.name, PORTAL_URL);
  return { ok: true };
}

// Unlink a parent from one child (deletes the student_parents row). Their
// pending invitation for that child is revoked so the roster doesn't show it
// again, and if this was their last child at the school their parent membership
// goes too — otherwise they'd keep a portal login with nothing in it.
export async function unlinkParent(input: {
  parentId: string;
  studentId: string;
}): Promise<Result> {
  const { school } = await requireRole("admin");
  if (!school) return { ok: false, error: "No school context." };

  const admin = createAdminClient();
  const { data: student } = await admin
    .from("students")
    .select("id,school_id")
    .eq("id", input.studentId)
    .maybeSingle();
  if (!student || student.school_id !== school.id) {
    return { ok: false, error: "Student not found in your school." };
  }

  const { data: removed, error } = await admin
    .from("student_parents")
    .delete()
    .eq("student_id", student.id)
    .eq("parent_id", input.parentId)
    .select("parent_id");
  if (error) return { ok: false, error: error.message };
  if (!removed?.length) return { ok: false, error: "That parent isn't linked to this child." };

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.parentId)
    .maybeSingle();
  if (profile?.email) {
    await admin
      .from("invitations")
      .update({ status: "revoked" })
      .eq("school_id", school.id)
      .eq("role", "parent")
      .eq("student_id", student.id)
      .eq("status", "pending")
      .eq("email", profile.email.toLowerCase());
  }

  const { data: schoolStudents } = await admin
    .from("students")
    .select("id")
    .eq("school_id", school.id);
  const ids = (schoolStudents ?? []).map((s) => s.id);
  const { count } = ids.length
    ? await admin
        .from("student_parents")
        .select("student_id", { count: "exact", head: true })
        .eq("parent_id", input.parentId)
        .in("student_id", ids)
    : { count: 0 };
  if (!count) {
    await admin
      .from("memberships")
      .delete()
      .eq("user_id", input.parentId)
      .eq("school_id", school.id)
      .eq("role", "parent");
  }

  revalidatePath("/dashboard/invites");
  return { ok: true };
}

// Edit a linked parent's display name. Service role: the profile belongs to
// the parent (profiles_update_self), so the admin can't write it directly.
export async function updateParentName(input: {
  parentId: string;
  name: string;
}): Promise<Result> {
  const { school } = await requireRole("admin");
  if (!school) return { ok: false, error: "No school context." };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter the parent's name." };

  // Only a parent of one of this school's children.
  const admin = createAdminClient();
  const { data: links } = await admin
    .from("student_parents")
    .select("student:students!inner(school_id)")
    .eq("parent_id", input.parentId)
    .eq("student.school_id", school.id)
    .limit(1);
  if (!links?.length) return { ok: false, error: "Parent not found in your school." };

  const { error } = await admin
    .from("profiles")
    .update({ full_name: name })
    .eq("id", input.parentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/invites");
  return { ok: true };
}
