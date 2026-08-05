"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";
import { getStudentParentEmails } from "@/lib/db/people";
import { sendFeverAlert } from "@/lib/email/notifications";
import type { CurriculumStatus } from "@/lib/db/types";

type Result = { ok: boolean; error?: string };

async function ctxClient() {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  return { ctx, supabase };
}

// Create or update a student's termly report (one row per student). Staff-only;
// RLS enforces the school boundary.
export async function upsertTermlyReport(input: {
  studentId: string;
  term: string;
  academicYear: string;
  teacherName?: string;
  summary?: string;
  strengths: string[];
  areasForGrowth: string[];
  characterRatings: Record<string, number>;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  if (ctx.role !== "admin" && ctx.role !== "teacher") {
    return { ok: false, error: "Not authorized" };
  }

  const payload = {
    school_id: ctx.school.id,
    student_id: input.studentId,
    term: input.term,
    academic_year: input.academicYear,
    teacher_name: input.teacherName ?? ctx.user.full_name ?? null,
    teacher_comments: input.summary ?? null,
    strengths: input.strengths,
    areas_for_growth: input.areasForGrowth,
    character_ratings: JSON.parse(JSON.stringify(input.characterRatings ?? {})),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("progress")
    .upsert(payload, { onConflict: "student_id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/teacher/reports/termly");
  revalidatePath("/parent/termly-report");
  revalidatePath("/parent/progress");
  return { ok: true };
}

export async function createObservation(input: {
  studentId: string;
  leafId: string;
  content: string;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("observations").insert({
    school_id: ctx.school.id,
    student_id: input.studentId,
    teacher_id: ctx.user.id,
    leaf_id: input.leafId,
    content: input.content,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/teacher/observations");
  return { ok: true };
}

async function upsertProgress(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  schoolId: string,
  studentId: string,
  leafId: string,
  status?: CurriculumStatus,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("curriculum_progress")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("leaf_id", leafId)
    .maybeSingle();
  if (existing) {
    if (status && status !== existing.status) {
      await supabase.from("curriculum_progress").update({ status, updated_at: new Date().toISOString() }).eq("id", existing.id);
    }
    return existing.id;
  }
  const { data: created } = await supabase
    .from("curriculum_progress")
    .insert({
      school_id: schoolId,
      student_id: studentId,
      leaf_id: leafId,
      status: status ?? "introduced",
    })
    .select("id")
    .single();
  return created?.id ?? null;
}

export async function setCurriculumStatus(input: {
  studentId: string;
  leafId: string;
  status: CurriculumStatus;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  await upsertProgress(supabase, ctx.school.id, input.studentId, input.leafId, input.status);
  revalidatePath("/teacher/curriculum");
  return { ok: true };
}

export async function addPractice(input: {
  studentId: string;
  leafId: string;
  date?: string;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const progressId = await upsertProgress(supabase, ctx.school.id, input.studentId, input.leafId);
  if (!progressId) return { ok: false, error: "Could not record practice" };
  const { error } = await supabase.from("curriculum_practices").insert({
    curriculum_progress_id: progressId,
    practiced_on: input.date ?? new Date().toISOString().slice(0, 10),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/teacher/curriculum");
  return { ok: true };
}

export async function addActivityPost(input: {
  studentId: string;
  caption: string;
  imageUrl: string;
  leafId?: string;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("activity_posts").insert({
    school_id: ctx.school.id,
    student_id: input.studentId,
    teacher_id: ctx.user.id,
    caption: input.caption,
    image_url: input.imageUrl,
    leaf_id: input.leafId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/teacher/activity");
  revalidatePath("/parent");
  return { ok: true };
}

// Parent likes/unlikes a post (toggles their own like row).
export async function toggleActivityLike(postId: string): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx || !supabase) return { ok: false, error: "Not authorized" };
  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("parent_id", ctx.user.id)
    .maybeSingle();
  if (existing) {
    await supabase.from("post_likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, parent_id: ctx.user.id });
  }
  revalidatePath("/parent");
  return { ok: true };
}

export async function updateDailyReportStatus(
  reportId: string,
  status: "draft" | "sent",
): Promise<Result> {
  const { supabase } = await ctxClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const patch: { status: "draft" | "sent"; sent_at?: string } = { status };
  if (status === "sent") patch.sent_at = new Date().toISOString();
  const { error } = await supabase.from("daily_reports").update(patch).eq("id", reportId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/reports");
  revalidatePath("/parent/reports");
  return { ok: true };
}

export async function addDailyActivityLogs(input: {
  studentIds: string[];
  date: string;
  time: string;
  activityType: string;
  value: string;
  notes?: string;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const rows = input.studentIds.map((studentId) => ({
    school_id: ctx.school!.id,
    student_id: studentId,
    teacher_id: ctx.user.id,
    log_date: input.date,
    log_time: input.time,
    activity_type: input.activityType,
    value: input.value,
    notes: input.notes ?? null,
  }));
  const { error } = await supabase.from("daily_activity_logs").insert(rows);
  if (error) return { ok: false, error: error.message };
  // Fever alert: any temperature reading >= 38°C notifies that child's parents.
  if (input.activityType === "temperature") {
    const temp = parseFloat(input.value.replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(temp) && temp >= 38) {
      const { data: students } = await supabase
        .from("students")
        .select("id, name")
        .in("id", input.studentIds);
      await Promise.all(
        (students ?? []).map(async (s) => {
          const emails = await getStudentParentEmails(supabase, s.id);
          return sendFeverAlert(emails, ctx.school!.name, {
            studentName: s.name,
            temperature: String(temp),
            time: input.time,
          });
        }),
      );
    }
  }
  revalidatePath("/teacher/log");
  return { ok: true };
}
