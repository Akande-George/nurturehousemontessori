"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";
import { getStudentById } from "@/lib/db/students";
import { getStudentParentEmails } from "@/lib/db/people";
import {
  collectDailyInputs,
  type DailyReportRow,
} from "@/lib/db/dailyReports";
import { buildDailySnapshot } from "@/lib/montessori/daily-snapshot";
import {
  DAILY_DEFAULT_SECTIONS,
  defaultDailyNarrative,
  formatLongDate,
  readDailyNarrative,
  readDailySections,
  readDailySnapshot,
  type DailyNarrative,
  type DailySections,
} from "@/lib/montessori/daily";
import { sendDailyReportPublished } from "@/lib/email/notifications";

type Result = { ok: boolean; error?: string };

const TEACHER_LIST = "/teacher/reports/daily";
const PARENT_LIST = "/parent/reports";

async function requireStaff() {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) {
    return { error: "Not authorized" as const, ctx: null, supabase: null };
  }
  if (ctx.role !== "admin" && ctx.role !== "teacher") {
    return { error: "Not authorized" as const, ctx: null, supabase: null };
  }
  return { error: null, ctx, supabase };
}

function revalidateAll(id?: string) {
  revalidatePath(TEACHER_LIST);
  revalidatePath(PARENT_LIST);
  revalidatePath("/dashboard/reports");
  if (id) {
    revalidatePath(`${TEACHER_LIST}/${id}`);
    revalidatePath(`${PARENT_LIST}/${id}`);
  }
}

/**
 * Build (or rebuild) a draft daily report for one child on one day. Returns the
 * row id. A report that has already been sent is left alone.
 */
export async function generateDailyReport(input: {
  studentId: string;
  reportDate: string;
  sections?: Partial<DailySections>;
}): Promise<Result & { id?: string }> {
  const { error, ctx, supabase } = await requireStaff();
  if (error || !ctx?.school || !supabase) {
    return { ok: false, error: error ?? "Not authorized" };
  }

  const student = await getStudentById(supabase, input.studentId);
  if (!student || student.school_id !== ctx.school.id) {
    return { ok: false, error: "Child not found" };
  }
  // daily_reports.age_group is NOT NULL and the admin queue displays it, so
  // refuse rather than guessing a band that may be wrong for this child.
  if (!student.age_group) {
    return {
      ok: false,
      error: `Set ${student.name.split(" ")[0]}'s age group on their profile before generating a daily report.`,
    };
  }

  const { data: existingRow } = await supabase
    .from("daily_reports")
    .select("id, status")
    .eq("student_id", input.studentId)
    .eq("report_date", input.reportDate)
    .maybeSingle();
  const existing = existingRow as Pick<DailyReportRow, "id" | "status"> | null;
  if (existing?.status === "sent") {
    return {
      ok: false,
      error: "This day's report has already been sent — move it back to draft first.",
    };
  }

  const snapshotInput = await collectDailyInputs(supabase, {
    school: ctx.school,
    student,
    teacherName: ctx.user.full_name ?? "",
    reportDate: input.reportDate,
  });
  const snapshot = buildDailySnapshot(snapshotInput);

  const payload = {
    school_id: ctx.school.id,
    student_id: input.studentId,
    teacher_id: ctx.user.id,
    age_group: student.age_group,
    report_date: input.reportDate,
    status: "draft" as const,
    sections: { ...DAILY_DEFAULT_SECTIONS, ...(input.sections ?? {}) },
    snapshot: JSON.parse(JSON.stringify(snapshot)),
    narrative: JSON.parse(JSON.stringify(defaultDailyNarrative(snapshot))),
    generated_at: new Date().toISOString(),
    sent_at: null,
    updated_at: new Date().toISOString(),
  };

  const { data, error: dbError } = await supabase
    .from("daily_reports")
    .upsert(payload, { onConflict: "student_id,report_date" })
    .select("id")
    .single();
  if (dbError) return { ok: false, error: dbError.message };

  revalidateAll(data.id);
  return { ok: true, id: data.id };
}

/** Generate drafts for a whole list of children at once (one classroom, one day). */
export async function generateDailyReportsForStudents(input: {
  studentIds: string[];
  reportDate: string;
}): Promise<Result & { created?: number; skipped?: number }> {
  const { error } = await requireStaff();
  if (error) return { ok: false, error };

  let created = 0;
  let skipped = 0;
  for (const studentId of input.studentIds) {
    const res = await generateDailyReport({
      studentId,
      reportDate: input.reportDate,
    });
    if (res.ok) created += 1;
    else skipped += 1;
  }
  revalidateAll();
  return { ok: true, created, skipped };
}

export async function updateDailyReport(input: {
  id: string;
  narrative?: Partial<DailyNarrative>;
  sections?: Partial<DailySections>;
}): Promise<Result> {
  const { error, supabase } = await requireStaff();
  if (error || !supabase) return { ok: false, error: error ?? "Not authorized" };

  const { data } = await supabase
    .from("daily_reports")
    .select("narrative, sections, status")
    .eq("id", input.id)
    .maybeSingle();
  const current = data as Pick<
    DailyReportRow,
    "narrative" | "sections" | "status"
  > | null;
  if (!current) return { ok: false, error: "Report not found" };
  if (current.status === "sent") {
    return { ok: false, error: "Sent reports can't be edited." };
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  let merged: DailyNarrative | null = null;
  if (input.narrative) {
    merged = { ...readDailyNarrative(current.narrative), ...input.narrative };
    patch.narrative = JSON.parse(JSON.stringify(merged));
    // Mirror the mood onto its own column so the admin queue and any legacy
    // reader keep working.
    patch.general_mood = merged.mood || null;
  }
  if (input.sections) {
    patch.sections = { ...readDailySections(current.sections), ...input.sections };
  }

  const { error: dbError } = await supabase
    .from("daily_reports")
    .update(patch)
    .eq("id", input.id)
    .eq("status", "draft");
  if (dbError) return { ok: false, error: dbError.message };

  revalidateAll(input.id);
  return { ok: true };
}

/** Re-collect the day's care logs, lessons, notes and photos, keeping the writing. */
export async function regenerateDailySnapshot(id: string): Promise<Result> {
  const { error, ctx, supabase } = await requireStaff();
  if (error || !ctx?.school || !supabase) {
    return { ok: false, error: error ?? "Not authorized" };
  }

  const { data } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const report = data as DailyReportRow | null;
  if (!report) return { ok: false, error: "Report not found" };
  if (report.status === "sent") {
    return { ok: false, error: "Sent reports can't be edited." };
  }

  const student = await getStudentById(supabase, report.student_id);
  if (!student) return { ok: false, error: "Child not found" };

  const snapshotInput = await collectDailyInputs(supabase, {
    school: ctx.school,
    student,
    teacherName:
      readDailySnapshot(report.snapshot)?.header.teacherName ??
      ctx.user.full_name ??
      "",
    reportDate: report.report_date,
  });
  const snapshot = buildDailySnapshot(snapshotInput);

  // Newly-collected notes and photos default to included; previously unticked
  // ones stay unticked.
  const narrative = readDailyNarrative(report.narrative);
  const previous = readDailySnapshot(report.snapshot);
  const knownNoteIds = new Set(previous?.notes.map((n) => n.id) ?? []);
  const knownPictureIds = new Set(previous?.pictures.map((p) => p.id) ?? []);
  const merged: DailyNarrative = {
    ...narrative,
    includedNoteIds: [
      ...narrative.includedNoteIds.filter((noteId) =>
        snapshot.notes.some((n) => n.id === noteId),
      ),
      ...snapshot.notes.filter((n) => !knownNoteIds.has(n.id)).map((n) => n.id),
    ],
    includedPictureIds: [
      ...narrative.includedPictureIds.filter((picId) =>
        snapshot.pictures.some((p) => p.id === picId),
      ),
      ...snapshot.pictures
        .filter((p) => !knownPictureIds.has(p.id))
        .map((p) => p.id),
    ],
  };

  const { error: dbError } = await supabase
    .from("daily_reports")
    .update({
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      narrative: JSON.parse(JSON.stringify(merged)),
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "draft");
  if (dbError) return { ok: false, error: dbError.message };

  revalidateAll(id);
  return { ok: true };
}

export async function sendDailyReport(id: string): Promise<Result> {
  const { error, ctx, supabase } = await requireStaff();
  if (error || !ctx?.school || !supabase) {
    return { ok: false, error: error ?? "Not authorized" };
  }

  const { data } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const report = data as DailyReportRow | null;
  if (!report) return { ok: false, error: "Report not found" };

  const { error: dbError } = await supabase
    .from("daily_reports")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (dbError) return { ok: false, error: dbError.message };

  // Best-effort notification; a mail failure must not undo the send.
  try {
    const snapshot = readDailySnapshot(report.snapshot);
    const emails = await getStudentParentEmails(supabase, report.student_id);
    if (emails.length > 0) {
      await sendDailyReportPublished(emails, ctx.school.name, {
        studentName: snapshot?.header.childName ?? "Your child",
        date: formatLongDate(report.report_date),
      });
    }
  } catch {
    // ignored
  }

  revalidateAll(id);
  return { ok: true };
}

export async function unsendDailyReport(id: string): Promise<Result> {
  const { error, supabase } = await requireStaff();
  if (error || !supabase) return { ok: false, error: error ?? "Not authorized" };

  const { error: dbError } = await supabase
    .from("daily_reports")
    .update({
      status: "draft",
      sent_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (dbError) return { ok: false, error: dbError.message };

  revalidateAll(id);
  return { ok: true };
}

export async function deleteDailyReport(id: string): Promise<Result> {
  const { error, supabase } = await requireStaff();
  if (error || !supabase) return { ok: false, error: error ?? "Not authorized" };

  const { data } = await supabase
    .from("daily_reports")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  const report = data as Pick<DailyReportRow, "status"> | null;
  if (!report) return { ok: false, error: "Report not found" };
  if (report.status === "sent") {
    return { ok: false, error: "Move the report back to draft before deleting it." };
  }

  const { error: dbError } = await supabase
    .from("daily_reports")
    .delete()
    .eq("id", id)
    .eq("status", "draft");
  if (dbError) return { ok: false, error: dbError.message };

  revalidateAll(id);
  return { ok: true };
}
