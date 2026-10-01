"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/context";
import { createAdminClient } from "@/supabase/admin";
import { sendStaffInvite } from "@/lib/email/notifications";
import { PORTAL_URL } from "@/lib/site-url";

type Result = { ok: boolean; error?: string };

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
  // Montessori classrooms to assign up front (teachers only).
  classrooms?: string[];
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
      .eq("full_name", ""); // only fill an unset name (column defaults to '')
  }

  // A person can hold only one role per school (unique user_id + school_id).
  const { error: mErr } = await admin
    .from("memberships")
    .upsert(
      { user_id: user.id, school_id: school.id, role: input.role },
      { onConflict: "user_id,school_id" },
    );
  if (mErr) return { ok: false, error: mErr.message };

  // A Montessori teacher can be in more than one classroom, so assignments are
  // saved up front here rather than class-by-class later.
  if (input.role === "teacher" && input.classrooms?.length) {
    const saved = await replaceTeacherClassrooms(
      admin,
      school.id,
      user.id,
      input.classrooms,
    );
    if (!saved.ok) return saved;
  }

  await admin.from("invitations").insert({
    school_id: school.id,
    email,
    role: input.role,
    token: crypto.randomUUID(),
    status: "pending",
  });

  await sendStaffInvite(email, school.name, ROLE_LABEL[input.role], PORTAL_URL);

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
  const { data: membership } = await admin
    .from("memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("school_id", school.id)
    .maybeSingle();
  if (membership?.role === "admin" && (await countAdmins(admin, school.id)) <= 1) {
    return { ok: false, error: "A school needs at least one admin." };
  }
  const { error } = await admin
    .from("memberships")
    .delete()
    .eq("user_id", userId)
    .eq("school_id", school.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

// Replace a teacher's classroom assignments with exactly `classrooms`. Names are
// checked against the school's classrooms, so a stale or forged value is dropped
// rather than written.
async function replaceTeacherClassrooms(
  admin: ReturnType<typeof createAdminClient>,
  schoolId: string,
  teacherId: string,
  classrooms: string[],
): Promise<Result> {
  const { data: rooms } = await admin
    .from("classrooms")
    .select("name")
    .eq("school_id", schoolId);
  const known = new Set((rooms ?? []).map((r) => r.name));
  const wanted = [...new Set(classrooms.map((c) => c.trim()))].filter((c) =>
    known.has(c),
  );

  const { data: existing } = await admin
    .from("teacher_classroom_assignments")
    .select("id, classroom")
    .eq("school_id", schoolId)
    .eq("teacher_id", teacherId);
  const current = existing ?? [];

  const staleIds = current
    .filter((r) => !wanted.includes(r.classroom))
    .map((r) => r.id);
  if (staleIds.length) {
    const { error } = await admin
      .from("teacher_classroom_assignments")
      .delete()
      .in("id", staleIds);
    if (error) return { ok: false, error: error.message };
  }

  const toAdd = wanted.filter(
    (name) => !current.some((r) => r.classroom === name),
  );
  if (toAdd.length) {
    const { error } = await admin.from("teacher_classroom_assignments").insert(
      toAdd.map((classroom) => ({
        school_id: schoolId,
        teacher_id: teacherId,
        classroom,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

// Change which classrooms a teacher covers, from the staff list.
export async function setTeacherClassrooms(
  userId: string,
  classrooms: string[],
): Promise<Result> {
  const { school } = await requireRole("admin");
  if (!school) return { ok: false, error: "No school context." };

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("school_id", school.id)
    .maybeSingle();
  if (!membership) {
    return { ok: false, error: "That person is not on your staff." };
  }
  if (membership.role !== "teacher") {
    return { ok: false, error: "Only teachers can be assigned to classrooms." };
  }

  const saved = await replaceTeacherClassrooms(
    admin,
    school.id,
    userId,
    classrooms,
  );
  if (!saved.ok) return saved;

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

async function countAdmins(
  admin: ReturnType<typeof createAdminClient>,
  schoolId: string,
): Promise<number> {
  const { count } = await admin
    .from("memberships")
    .select("user_id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("role", "admin");
  return count ?? 0;
}

// Edit a staff member from the directory: display name, role (admin <->
// teacher) and, for Montessori teachers, their classrooms. An admin can't change
// their own role, and the school's last admin can't be demoted.
export async function updateStaffMember(input: {
  userId: string;
  name: string;
  role: "admin" | "teacher";
  // Only applied when the member ends up a teacher; omit to leave as-is.
  classrooms?: string[];
}): Promise<Result> {
  const { school, user } = await requireRole("admin");
  if (!school) return { ok: false, error: "No school context." };
  if (input.role !== "admin" && input.role !== "teacher") {
    return { ok: false, error: "Choose a valid role." };
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("role")
    .eq("user_id", input.userId)
    .eq("school_id", school.id)
    .maybeSingle();
  if (!membership || (membership.role !== "admin" && membership.role !== "teacher")) {
    return { ok: false, error: "That person is not on your staff." };
  }

  if (input.role !== membership.role) {
    if (input.userId === user.id) {
      return { ok: false, error: "You can't change your own role." };
    }
    if (membership.role === "admin" && (await countAdmins(admin, school.id)) <= 1) {
      return { ok: false, error: "A school needs at least one admin." };
    }
  }

  // The name lives on the shared profile (service role: profiles_update_self
  // only lets people edit their own). Blank clears it, so the email shows.
  const { error: pErr } = await admin
    .from("profiles")
    .update({ full_name: input.name.trim() })
    .eq("id", input.userId);
  if (pErr) return { ok: false, error: pErr.message };

  if (input.role !== membership.role) {
    const { error } = await admin
      .from("memberships")
      .update({ role: input.role })
      .eq("user_id", input.userId)
      .eq("school_id", school.id);
    if (error) return { ok: false, error: error.message };
  }

  // Classroom assignments are teacher-only (see setTeacherClassrooms), so a
  // promotion to admin clears them.
  if (input.role === "admin" && membership.role === "teacher") {
    const { error } = await admin
      .from("teacher_classroom_assignments")
      .delete()
      .eq("school_id", school.id)
      .eq("teacher_id", input.userId);
    if (error) return { ok: false, error: error.message };
  } else if (input.role === "teacher" && input.classrooms) {
    const saved = await replaceTeacherClassrooms(
      admin,
      school.id,
      input.userId,
      input.classrooms,
    );
    if (!saved.ok) return saved;
  }

  revalidatePath("/dashboard/settings");
  return { ok: true };
}
