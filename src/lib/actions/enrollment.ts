"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import { requireRole } from "@/lib/auth/context";
import { linkParentToStudent } from "@/lib/server/link-parent";
import {
  sendApplicationReceived,
  sendNewApplicationAlert,
  sendApplicationAccepted,
} from "@/lib/email/notifications";

type Result = { ok: boolean; error?: string };

// PUBLIC (unauthenticated) — uses the service-role client to insert the
// application and notify. Applicant picks a school (schoolId).
export async function submitApplication(input: {
  schoolId: string;
  childName: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  details?: Record<string, unknown>;
}): Promise<Result> {
  if (!input.schoolId || !input.childName.trim() || !input.parentEmail.trim()) {
    return { ok: false, error: "Please complete the required fields." };
  }
  const admin = createAdminClient();
  const { error } = await admin.from("enrollment_applications").insert({
    school_id: input.schoolId,
    child_name: input.childName.trim(),
    parent_name: input.parentName.trim(),
    parent_email: input.parentEmail.trim(),
    parent_phone: input.parentPhone ?? null,
    details: JSON.parse(JSON.stringify(input.details ?? {})),
    status: "submitted",
  });
  if (error) return { ok: false, error: error.message };

  const { data: school } = await admin
    .from("schools")
    .select("name")
    .eq("id", input.schoolId)
    .maybeSingle();
  const schoolName = school?.name ?? "the school";

  // Confirmation to applicant + alert to school staff (best-effort).
  await sendApplicationReceived(input.parentEmail.trim(), schoolName, {
    childName: input.childName.trim(),
  });
  const { data: staff } = await admin
    .from("memberships")
    .select("profile:profiles(email)")
    .eq("school_id", input.schoolId)
    .in("role", ["admin", "teacher"]);
  const staffEmails = (staff ?? [])
    .map((r) => (r.profile as { email?: string } | null)?.email)
    .filter((e): e is string => Boolean(e));
  await sendNewApplicationAlert(staffEmails, schoolName, {
    childName: input.childName.trim(),
    parentName: input.parentName.trim(),
  });
  return { ok: true };
}

// Admin accepts an application → creates the student + emails the family.
export async function acceptApplication(applicationId: string): Promise<Result> {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!school || !supabase) return { ok: false, error: "Not authorized" };

  const { data: app } = await supabase
    .from("enrollment_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) return { ok: false, error: "Application not found" };

  const { data: student, error: stuErr } = await supabase
    .from("students")
    .insert({
      school_id: school.id,
      name: app.child_name,
    })
    .select("id")
    .single();
  if (stuErr || !student) {
    return { ok: false, error: stuErr?.message ?? "Could not create the student." };
  }

  await supabase
    .from("enrollment_applications")
    .update({ status: "accepted" })
    .eq("id", applicationId);

  // Acceptance letter + create/link the parent's portal account and invite them.
  await sendApplicationAccepted(app.parent_email, school.name, {
    childName: app.child_name,
  });
  if (app.parent_email) {
    await linkParentToStudent({
      schoolId: school.id,
      schoolName: school.name,
      studentId: student.id,
      email: app.parent_email,
      name: app.parent_name ?? undefined,
    });
  }

  revalidatePath("/dashboard/enrollment");
  revalidatePath("/dashboard/students");
  return { ok: true };
}

export async function rejectApplication(applicationId: string): Promise<Result> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const { error } = await supabase
    .from("enrollment_applications")
    .update({ status: "rejected" })
    .eq("id", applicationId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/enrollment");
  return { ok: true };
}
