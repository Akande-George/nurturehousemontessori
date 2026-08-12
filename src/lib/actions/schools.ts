"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { requireRole, getActiveContext } from "@/lib/auth/context";
import { getSchoolParentEmails, getSchoolStaffEmails } from "@/lib/db/people";
import { sendNoticeFanout, sendStatusChange } from "@/lib/email/notifications";
import type { SchoolStatus, SchoolTheme } from "@/lib/db/types";

type Result = { ok: boolean; error?: string };

// Super-admin or the school's own admin may edit branding/profile.
export async function updateSchoolBranding(
  schoolId: string,
  patch: {
    name?: string;
    contact_email?: string;
    phone?: string;
    address?: string;
    bank_name?: string | null;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
    theme?: SchoolTheme;
  },
): Promise<Result> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const { error } = await supabase.from("schools").update(patch).eq("id", schoolId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/super-admin/schools");
  revalidatePath(`/super-admin/schools/${schoolId}`);
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function setSchoolStatus(
  schoolId: string,
  status: SchoolStatus,
): Promise<Result> {
  await requireRole("super_admin");
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const { error } = await supabase
    .from("schools")
    .update({ status })
    .eq("id", schoolId);
  if (error) return { ok: false, error: error.message };
  const { data: school } = await supabase
    .from("schools")
    .select("name")
    .eq("id", schoolId)
    .maybeSingle();
  const admins = await getSchoolStaffEmails(supabase, schoolId);
  await sendStatusChange(admins, school?.name ?? "Your school", status);
  revalidatePath("/super-admin/schools");
  revalidatePath(`/super-admin/schools/${schoolId}`);
  return { ok: true };
}

// Post a notice to a school's board. Super-admin (any school) or a school's own
// staff. RLS enforces the boundary; author is the current user.
export async function sendSchoolNotification(
  schoolId: string,
  input: { title: string; content: string },
): Promise<Result> {
  const ctx = await getActiveContext();
  if (!ctx) return { ok: false, error: "Not signed in" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const { error } = await supabase.from("notices").insert({
    school_id: schoolId,
    title: input.title,
    content: input.content,
    author_id: ctx.user.id,
    audience: "all-parents",
  });
  if (error) return { ok: false, error: error.message };
  const { data: school } = await supabase
    .from("schools")
    .select("name")
    .eq("id", schoolId)
    .maybeSingle();
  const emails = await getSchoolParentEmails(supabase, schoolId);
  await sendNoticeFanout(emails, school?.name ?? "Your school", {
    title: input.title,
    content: input.content,
  });
  revalidatePath(`/super-admin/schools/${schoolId}`);
  return { ok: true };
}
