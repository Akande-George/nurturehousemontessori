import "server-only";
import { createAdminClient } from "@/supabase/admin";
import { sendParentPortalInvite } from "@/lib/email/notifications";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Ensure a parent has a portal account, is a member of the school, is linked to
// the given student, and has been emailed a sign-in link. Idempotent: safe to
// call again for an existing parent/link. Uses the service-role client because
// it creates auth users and writes memberships across users.
export async function linkParentToStudent(input: {
  schoolId: string;
  schoolName: string;
  studentId: string;
  email: string;
  name?: string;
  invitedBy?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "Missing parent email." };

  const admin = createAdminClient();

  // Find or create the parent's passwordless account.
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let parent = list?.users?.find((u) => u.email?.toLowerCase() === email);
  if (!parent) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: input.name?.trim() || "" },
    });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "Could not create the parent account." };
    }
    parent = data.user;
  } else if (input.name?.trim()) {
    await admin
      .from("profiles")
      .update({ full_name: input.name.trim() })
      .eq("id", parent.id)
      .is("full_name", null);
  }

  const { error: mErr } = await admin
    .from("memberships")
    .upsert(
      { user_id: parent.id, school_id: input.schoolId, role: "parent" },
      { onConflict: "user_id,school_id" },
    );
  if (mErr) return { ok: false, error: mErr.message };

  const { error: spErr } = await admin
    .from("student_parents")
    .upsert(
      { student_id: input.studentId, parent_id: parent.id },
      { onConflict: "student_id,parent_id" },
    );
  if (spErr) return { ok: false, error: spErr.message };

  await admin.from("invitations").insert({
    school_id: input.schoolId,
    email,
    role: "parent",
    student_id: input.studentId,
    token: crypto.randomUUID(),
    status: "pending",
    invited_by: input.invitedBy ?? null,
  });

  await sendParentPortalInvite(email, input.schoolName, `${APP_URL}/login`);
  return { ok: true };
}
