"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";
import { getStudentParentEmails } from "@/lib/db/people";
import { sendFeverAlert } from "@/lib/email/notifications";
import {
  CARE_TYPES,
  FEVER_THRESHOLD_C,
  parseTemperature,
  type CareType,
} from "@/lib/montessori/daily";

// Edit/delete for the care logs written by addDailyActivityLogs (which lives in
// ./montessori.ts). Any staff member of the school may correct an entry — RLS
// (dal_write) enforces the same rule.

type Result = { ok: boolean; error?: string };

async function staffClient() {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) return null;
  if (ctx.role !== "admin" && ctx.role !== "teacher") return null;
  return { ctx, school: ctx.school, supabase };
}

const isFever = (type: string, value: string | null) =>
  type === "temperature" && parseTemperature(value) >= FEVER_THRESHOLD_C;

export async function updateDailyActivityLog(input: {
  id: string;
  date: string;
  time: string;
  activityType: string;
  value: string;
  notes?: string;
}): Promise<Result & { notified?: boolean }> {
  const auth = await staffClient();
  if (!auth) return { ok: false, error: "Not authorized" };
  const { school, supabase } = auth;

  if (!CARE_TYPES.includes(input.activityType as CareType)) {
    return { ok: false, error: "Choose a valid record type." };
  }
  if (!input.date) return { ok: false, error: "Choose a date." };
  const value = input.value.trim();
  if (!value) return { ok: false, error: "Add a value for this record." };
  if (
    input.activityType === "temperature" &&
    Number.isNaN(parseTemperature(value))
  ) {
    return { ok: false, error: "Enter the temperature as a number." };
  }

  const { data: existing } = await supabase
    .from("daily_activity_logs")
    .select("id, student_id, activity_type, value")
    .eq("id", input.id)
    .eq("school_id", school.id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "That entry no longer exists." };

  const { error } = await supabase
    .from("daily_activity_logs")
    .update({
      log_date: input.date,
      log_time: input.time || null,
      activity_type: input.activityType,
      value,
      notes: input.notes?.trim() || null,
    })
    .eq("id", existing.id);
  if (error) return { ok: false, error: error.message };

  // Only an edit that newly crosses the fever threshold alerts parents — the
  // same email addDailyActivityLogs sends. Correcting an entry that was
  // already a fever (or fixing a typo in its notes) sends nothing.
  let notified = false;
  if (
    isFever(input.activityType, value) &&
    !isFever(existing.activity_type, existing.value)
  ) {
    const { data: student } = await supabase
      .from("students")
      .select("name")
      .eq("id", existing.student_id)
      .maybeSingle();
    if (student) {
      const emails = await getStudentParentEmails(supabase, existing.student_id);
      await sendFeverAlert(emails, school.name, {
        studentName: student.name,
        temperature: String(parseTemperature(value)),
        time: input.time,
      });
      notified = true;
    }
  }

  revalidatePath("/teacher/log");
  return { ok: true, notified };
}

export async function deleteDailyActivityLog(id: string): Promise<Result> {
  const auth = await staffClient();
  if (!auth) return { ok: false, error: "Not authorized" };
  const { school, supabase } = auth;

  const { data, error } = await supabase
    .from("daily_activity_logs")
    .delete()
    .eq("id", id)
    .eq("school_id", school.id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "That entry no longer exists." };

  revalidatePath("/teacher/log");
  return { ok: true };
}
