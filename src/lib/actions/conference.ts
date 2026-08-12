"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";
import { getStudentById } from "@/lib/db/students";
import { getStudentParentEmails } from "@/lib/db/people";
import {
  collectConferenceInputs,
  type ConferenceReportRow,
} from "@/lib/db/conferenceReports";
import { buildConferenceSnapshot } from "@/lib/montessori/conference-snapshot";
import {
  DEFAULT_SECTIONS,
  TERM_LABELS,
  defaultNarrative,
  formatReportDate,
  readNarrative,
  readSections,
  readSnapshot,
  type ConferenceNarrative,
  type ConferenceSections,
} from "@/lib/montessori/conference";
import { sendProgressReportPublished } from "@/lib/email/notifications";
import type { Term } from "@/lib/db/types";

type Result = { ok: boolean; error?: string };

const TEACHER_LIST = "/teacher/reports/progress";
const PARENT_LIST = "/parent/progress-reports";

async function ctxClient() {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  return { ctx, supabase };
}

/** Staff-only guard shared by every action here. */
async function requireStaff() {
  const { ctx, supabase } = await ctxClient();
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
  if (id) {
    revalidatePath(`${TEACHER_LIST}/${id}`);
    revalidatePath(`${PARENT_LIST}/${id}`);
  }
}

export async function generateConferenceReport(input: {
  studentId: string;
  term: Term;
  academicYear: string;
  periodStart: string;
  periodEnd: string;
  sections?: Partial<ConferenceSections>;
}): Promise<Result & { id?: string }> {
  const { error, ctx, supabase } = await requireStaff();
  if (error || !ctx?.school || !supabase) return { ok: false, error: error ?? "Not authorized" };

  if (input.periodEnd < input.periodStart) {
    return { ok: false, error: "The period end must fall on or after the start." };
  }

  const student = await getStudentById(supabase, input.studentId);
  if (!student || student.school_id !== ctx.school.id) {
    return { ok: false, error: "Student not found" };
  }

  // A published report is a finished document — don't silently replace it.
  const { data: existing } = await supabase
    .from("conference_reports")
    .select("id, status")
    .eq("student_id", input.studentId)
    .eq("academic_year", input.academicYear)
    .eq("term", input.term)
    .maybeSingle();
  if (existing?.status === "published") {
    return {
      ok: false,
      error: "A published report already exists for this term — unpublish it first.",
    };
  }

  const snapshotInput = await collectConferenceInputs(supabase, {
    school: ctx.school,
    student,
    teacherName: ctx.user.full_name ?? "",
    term: input.term,
    academicYear: input.academicYear,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
  });
  const snapshot = buildConferenceSnapshot(snapshotInput);

  const firstName = student.name.split(" ")[0] || student.name;
  const payload = {
    school_id: ctx.school.id,
    student_id: input.studentId,
    author_id: ctx.user.id,
    title: `${firstName}'s Progress Report`,
    term: input.term,
    academic_year: input.academicYear,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    status: "draft" as const,
    sections: { ...DEFAULT_SECTIONS, ...(input.sections ?? {}) },
    snapshot: JSON.parse(JSON.stringify(snapshot)),
    narrative: JSON.parse(JSON.stringify(defaultNarrative(snapshot))),
    generated_at: new Date().toISOString(),
    published_at: null,
    updated_at: new Date().toISOString(),
  };

  const { data, error: dbError } = await supabase
    .from("conference_reports")
    .upsert(payload, { onConflict: "student_id,academic_year,term" })
    .select("id")
    .single();
  if (dbError) return { ok: false, error: dbError.message };

  revalidateAll(data.id);
  return { ok: true, id: data.id };
}

export async function updateConferenceReport(input: {
  id: string;
  narrative?: Partial<ConferenceNarrative>;
  sections?: Partial<ConferenceSections>;
  title?: string;
}): Promise<Result> {
  const { error, supabase } = await requireStaff();
  if (error || !supabase) return { ok: false, error: error ?? "Not authorized" };

  const { data: current } = await supabase
    .from("conference_reports")
    .select("narrative, sections, status")
    .eq("id", input.id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Report not found" };
  if (current.status === "published") {
    return { ok: false, error: "Published reports can't be edited." };
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.narrative) {
    patch.narrative = JSON.parse(
      JSON.stringify({ ...readNarrative(current.narrative), ...input.narrative }),
    );
  }
  if (input.sections) {
    patch.sections = { ...readSections(current.sections), ...input.sections };
  }
  if (typeof input.title === "string" && input.title.trim()) {
    patch.title = input.title.trim();
  }

  const { error: dbError } = await supabase
    .from("conference_reports")
    .update(patch)
    .eq("id", input.id)
    .eq("status", "draft");
  if (dbError) return { ok: false, error: dbError.message };

  revalidateAll(input.id);
  return { ok: true };
}

/** Re-collect the auto data (new practices, notes, photos) without touching the narrative. */
export async function regenerateConferenceSnapshot(id: string): Promise<Result> {
  const { error, ctx, supabase } = await requireStaff();
  if (error || !ctx?.school || !supabase) return { ok: false, error: error ?? "Not authorized" };

  const { data } = await supabase
    .from("conference_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const report = data as ConferenceReportRow | null;
  if (!report) return { ok: false, error: "Report not found" };
  if (report.status === "published") {
    return { ok: false, error: "Published reports can't be edited." };
  }

  const student = await getStudentById(supabase, report.student_id);
  if (!student) return { ok: false, error: "Student not found" };

  const snapshotInput = await collectConferenceInputs(supabase, {
    school: ctx.school,
    student,
    teacherName: readSnapshot(report.snapshot)?.header.teacherName ?? ctx.user.full_name ?? "",
    term: report.term,
    academicYear: report.academic_year,
    periodStart: report.period_start,
    periodEnd: report.period_end,
  });
  const snapshot = buildConferenceSnapshot(snapshotInput);

  // Keep everything typed; newly-collected notes/photos default to included.
  const narrative = readNarrative(report.narrative);
  const previous = readSnapshot(report.snapshot);
  const knownNoteIds = new Set(previous?.notes.map((n) => n.id) ?? []);
  const knownPictureIds = new Set(previous?.pictures.map((p) => p.id) ?? []);
  const merged: ConferenceNarrative = {
    ...narrative,
    areaComments: {
      ...Object.fromEntries(snapshot.areas.map((a) => [a.areaId, ""])),
      ...narrative.areaComments,
    },
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
    .from("conference_reports")
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

export async function publishConferenceReport(id: string): Promise<Result> {
  const { error, ctx, supabase } = await requireStaff();
  if (error || !ctx?.school || !supabase) return { ok: false, error: error ?? "Not authorized" };

  const { data } = await supabase
    .from("conference_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const report = data as ConferenceReportRow | null;
  if (!report) return { ok: false, error: "Report not found" };

  const { error: dbError } = await supabase
    .from("conference_reports")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (dbError) return { ok: false, error: dbError.message };

  const narrative = readNarrative(report.narrative);
  const snapshot = readSnapshot(report.snapshot);

  // `progress` is still read by /parent/progress and the teacher child-report,
  // and this is now its only writer — mirror the narrative across so those
  // screens don't go blank.
  await supabase.from("progress").upsert(
    {
      school_id: ctx.school.id,
      student_id: report.student_id,
      term: TERM_LABELS[report.term],
      academic_year: report.academic_year,
      teacher_name: snapshot?.header.teacherName ?? ctx.user.full_name ?? null,
      teacher_comments: narrative.summary || null,
      strengths: narrative.strengths,
      areas_for_growth: narrative.areasForGrowth,
      character_ratings: Object.fromEntries(
        Object.entries(narrative.character).filter(([, v]) => v > 0),
      ),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id" },
  );

  // Best-effort notification; a mail failure must not undo the publish.
  try {
    const emails = await getStudentParentEmails(supabase, report.student_id);
    if (emails.length > 0) {
      await sendProgressReportPublished(emails, ctx.school.name, {
        studentName: snapshot?.header.childName ?? "Your child",
        term: TERM_LABELS[report.term],
        period: `${formatReportDate(report.period_start)} – ${formatReportDate(report.period_end)}`,
      });
    }
  } catch {
    // ignored
  }

  revalidateAll(id);
  revalidatePath("/parent/progress");
  return { ok: true };
}

export async function unpublishConferenceReport(id: string): Promise<Result> {
  const { error, supabase } = await requireStaff();
  if (error || !supabase) return { ok: false, error: error ?? "Not authorized" };

  const { error: dbError } = await supabase
    .from("conference_reports")
    .update({
      status: "draft",
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (dbError) return { ok: false, error: dbError.message };

  revalidateAll(id);
  return { ok: true };
}

export async function deleteConferenceReport(id: string): Promise<Result> {
  const { error, supabase } = await requireStaff();
  if (error || !supabase) return { ok: false, error: error ?? "Not authorized" };

  const { data: report } = await supabase
    .from("conference_reports")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!report) return { ok: false, error: "Report not found" };
  if (report.status === "published") {
    return { ok: false, error: "Unpublish the report before deleting it." };
  }

  const { error: dbError } = await supabase
    .from("conference_reports")
    .delete()
    .eq("id", id)
    .eq("status", "draft");
  if (dbError) return { ok: false, error: dbError.message };

  revalidateAll(id);
  return { ok: true };
}
