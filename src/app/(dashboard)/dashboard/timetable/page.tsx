import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getClasses, getSubjects } from "@/lib/db/classes";
import { TimetableClient } from "./TimetableClient";
import type { TimetablePeriod } from "@/lib/db/types";

export default async function TimetablePage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [classes, subjects, periodsRes, membershipsRes] = await Promise.all([
    getClasses(supabase, school.id),
    getSubjects(supabase, school.id),
    supabase
      .from("timetable_periods")
      .select("*")
      .eq("school_id", school.id)
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("memberships")
      .select("user_id, role, profile:profiles(id, full_name)")
      .eq("school_id", school.id)
      .in("role", ["admin", "teacher"]),
  ]);

  const staff = (membershipsRes.data ?? [])
    .map((m) => ({
      id: m.user_id,
      name:
        (m.profile as unknown as { full_name?: string } | null)?.full_name ??
        "Staff",
    }))
    .filter((s) => s.id);

  const periodsByClass: Record<string, TimetablePeriod[]> = {};
  for (const p of (periodsRes.data ?? []) as TimetablePeriod[]) {
    (periodsByClass[p.class_id] ??= []).push(p);
  }

  return (
    <TimetableClient
      classes={classes}
      subjects={subjects}
      staff={staff}
      periodsByClass={periodsByClass}
    />
  );
}
