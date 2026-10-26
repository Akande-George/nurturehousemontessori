import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type DB = SupabaseClient<Database>;

export async function getSchoolParentEmails(
  db: DB,
  schoolId: string,
): Promise<string[]> {
  const { data } = await db
    .from("memberships")
    .select("profile:profiles(email)")
    .eq("school_id", schoolId)
    .eq("role", "parent");
  return (data ?? [])
    .map((r) => (r.profile as { email?: string } | null)?.email)
    .filter((e): e is string => Boolean(e));
}

export async function getStudentParentEmails(
  db: DB,
  studentId: string,
): Promise<string[]> {
  const { data } = await db
    .from("student_parents")
    .select("parent:profiles(email)")
    .eq("student_id", studentId);
  return (data ?? [])
    .map((r) => (r.parent as { email?: string } | null)?.email)
    .filter((e): e is string => Boolean(e));
}

export async function getClassParentEmails(
  db: DB,
  classId: string,
): Promise<string[]> {
  const { data: students } = await db
    .from("students")
    .select("id")
    .eq("class_id", classId);
  const ids = (students ?? []).map((s) => s.id);
  if (ids.length === 0) return [];
  const { data } = await db
    .from("student_parents")
    .select("parent:profiles(email)")
    .in("student_id", ids);
  const emails = (data ?? [])
    .map((r) => (r.parent as { email?: string } | null)?.email)
    .filter((e): e is string => Boolean(e));
  return Array.from(new Set(emails));
}

// Parent profiles (name + email) linked to a student — for invoice "Bill To".
export async function getStudentParentProfiles(
  db: DB,
  studentId: string,
): Promise<{ id: string; full_name: string; email: string }[]> {
  const { data } = await db
    .from("student_parents")
    .select("parent:profiles(id, full_name, email)")
    .eq("student_id", studentId);
  return (data ?? [])
    .map((r) => r.parent as { id: string; full_name: string; email: string } | null)
    .filter((p): p is { id: string; full_name: string; email: string } =>
      Boolean(p),
    );
}

// Staff (admin/teacher) emails for a school.
export async function getSchoolStaffEmails(
  db: DB,
  schoolId: string,
): Promise<string[]> {
  const { data } = await db
    .from("memberships")
    .select("profile:profiles(email)")
    .eq("school_id", schoolId)
    .in("role", ["admin", "teacher"]);
  return (data ?? [])
    .map((r) => (r.profile as { email?: string } | null)?.email)
    .filter((e): e is string => Boolean(e));
}

// One profile's email — used to tell the guide who wrote a report that the
// family has replied to it.
export async function getProfileEmail(
  db: DB,
  profileId: string | null,
): Promise<string | null> {
  if (!profileId) return null;
  const { data } = await db
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle();
  return data?.email ?? null;
}

/** One profile's display name — the byline under a parent's report comment. */
export async function getProfileName(
  db: DB,
  profileId: string | null,
): Promise<string | null> {
  if (!profileId) return null;
  const { data } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", profileId)
    .maybeSingle();
  return data?.full_name || null;
}
