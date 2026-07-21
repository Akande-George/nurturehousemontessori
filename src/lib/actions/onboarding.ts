"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin";
import { requireRole } from "@/lib/auth/context";
import { DEFAULT_THEME, type SchoolType } from "@/lib/db/types";

const THEME_BY_TYPE: Record<SchoolType, { primary: string; secondary: string; accent: string }> = {
  montessori: DEFAULT_THEME,
  regular: { primary: "67 56 202", secondary: "217 119 6", accent: "236 72 153" },
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function uniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  base: string,
): Promise<string> {
  const root = base || "school";
  let slug = root;
  let i = 0;
  // find an unused slug
  while (i < 50) {
    const { data } = await admin
      .from("schools")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    i += 1;
    slug = `${root}-${i}`;
  }
  return `${root}-${Math.floor(Math.random() * 100000)}`;
}

// Provision a school + its owner-admin, then create the record. Uses the
// service-role client because there is no session yet / it crosses tenants.
async function provisionSchool(input: {
  schoolName: string;
  type: SchoolType;
  adminName: string;
  adminEmail: string;
  password: string;
  phone?: string;
  status?: "active" | "pending";
}): Promise<{ schoolId: string } | { error: string }> {
  const admin = createAdminClient();

  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email: input.adminEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.adminName },
  });
  if (userErr || !userRes.user) {
    return { error: userErr?.message ?? "Could not create the admin account." };
  }

  const slug = await uniqueSlug(admin, slugify(input.schoolName));
  const { data: school, error: schoolErr } = await admin
    .from("schools")
    .insert({
      name: input.schoolName,
      slug,
      type: input.type,
      contact_email: input.adminEmail,
      phone: input.phone ?? "",
      status: input.status ?? "active",
      theme: THEME_BY_TYPE[input.type],
    })
    .select("id")
    .single();
  if (schoolErr || !school) {
    // roll back the auth user we just created
    await admin.auth.admin.deleteUser(userRes.user.id);
    return { error: schoolErr?.message ?? "Could not create the school." };
  }

  const { error: memErr } = await admin.from("memberships").insert({
    user_id: userRes.user.id,
    school_id: school.id,
    role: "admin",
  });
  if (memErr) return { error: memErr.message };

  return { schoolId: school.id };
}

// Public self-signup: create the school + owner, sign them in, land on /dashboard.
export async function registerSchool(input: {
  schoolName: string;
  type: SchoolType;
  adminName: string;
  adminEmail: string;
  password: string;
  phone?: string;
}): Promise<{ error?: string }> {
  const res = await provisionSchool({ ...input, status: "active" });
  if ("error" in res) return { error: res.error };
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signInWithPassword({
      email: input.adminEmail,
      password: input.password,
    });
  }
  redirect("/dashboard");
}

// Super-admin "Add School": provision with a generated temporary password that
// is returned so the super admin can hand it to the school. (Real invite emails
// come once Resend SMTP is configured.)
export async function createSchoolBySuperAdmin(input: {
  schoolName: string;
  type: SchoolType;
  adminName: string;
  adminEmail: string;
  phone?: string;
}): Promise<{ ok: boolean; tempPassword?: string; error?: string }> {
  await requireRole("super_admin");
  const tempPassword = `Sch-${Math.random().toString(36).slice(2, 10)}!`;
  const res = await provisionSchool({
    ...input,
    password: tempPassword,
    status: "active",
  });
  if ("error" in res) return { ok: false, error: res.error };
  revalidatePath("/super-admin/schools");
  return { ok: true, tempPassword };
}
