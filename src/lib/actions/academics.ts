"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";
import { computeClassReportCards } from "@/lib/db/reportCards";
import { getStudentParentEmails, getClassParentEmails } from "@/lib/db/people";
import {
  sendReportCardPublished,
  sendHomeworkAssigned,
} from "@/lib/email/notifications";
import { getStudentById } from "@/lib/db/students";
import {
  CURRENT_ACADEMIC_YEAR,
  type CAComponent,
  type ExamScore,
  type Term,
  type PromotionStatus,
} from "@/lib/db/types";

type Result = { ok: boolean; error?: string };

async function ctxClient() {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  return { ctx, supabase };
}

export async function saveScores(input: {
  classId: string;
  subjectId: string;
  term: Term;
  rows: { studentId: string; ca: CAComponent[]; exam: ExamScore }[];
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const payload = input.rows.map((r) => ({
    school_id: ctx.school!.id,
    student_id: r.studentId,
    class_id: input.classId,
    subject_id: input.subjectId,
    term: input.term,
    academic_year: CURRENT_ACADEMIC_YEAR,
    ca: r.ca,
    exam: r.exam,
    updated_by: ctx.user.id,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("assessment_scores")
    .upsert(payload, { onConflict: "student_id,class_id,subject_id,term" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/teacher/gradebook");
  return { ok: true };
}

// Generate/refresh + persist a student's report card from live class ranking.
export async function publishReportCard(
  studentId: string,
  classId: string,
  term: Term,
): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const rows = await computeClassReportCards(
    supabase,
    classId,
    term,
    CURRENT_ACADEMIC_YEAR,
  );
  const mine = rows.filter((r) => r.student_id === studentId);
  if (mine.length === 0) return { ok: false, error: "No scores to compute" };
  const first = mine[0];

  const { data: card, error: cErr } = await supabase
    .from("report_cards")
    .upsert(
      {
        school_id: ctx.school.id,
        student_id: studentId,
        class_id: classId,
        term,
        academic_year: CURRENT_ACADEMIC_YEAR,
        total_score: first.overall_total,
        average: first.overall_average,
        overall_position: first.overall_position,
        class_size: first.class_size,
        overall_grade: first.overall_grade,
        promotion_status: first.promotion_status,
        published_at: new Date().toISOString(),
      },
      { onConflict: "student_id,class_id,term" },
    )
    .select("id")
    .single();
  if (cErr || !card) return { ok: false, error: cErr?.message ?? "Failed" };

  await supabase.from("report_card_rows").delete().eq("report_card_id", card.id);
  await supabase.from("report_card_rows").insert(
    mine.map((r) => ({
      report_card_id: card.id,
      subject_id: r.subject_id,
      ca_total: r.ca_total,
      exam_score: r.exam_score,
      total: r.total,
      grade: r.grade,
      remark: r.remark,
      subject_position: r.subject_position,
    })),
  );
  // Best-effort "report card ready" email to the student's parents.
  const [emails, student] = await Promise.all([
    getStudentParentEmails(supabase, studentId),
    getStudentById(supabase, studentId),
  ]);
  await sendReportCardPublished(emails, ctx.school.name, {
    studentName: student?.name ?? "Your child",
    term: term === "first" ? "First Term" : term === "second" ? "Second Term" : "Third Term",
    average: `${Number(first.overall_average).toFixed(1)}%`,
    position: `${first.overall_position} of ${first.class_size}`,
  });
  revalidatePath("/teacher/report-cards");
  revalidatePath("/dashboard/results");
  return { ok: true };
}

export async function setReportCardRemarks(
  reportCardId: string,
  patch: {
    teacher_remark?: string;
    principal_remark?: string;
    promotion_status?: PromotionStatus;
  },
): Promise<Result> {
  const { supabase } = await ctxClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const { error } = await supabase
    .from("report_cards")
    .update(patch)
    .eq("id", reportCardId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/teacher/report-cards");
  return { ok: true };
}

export async function createClass(input: {
  name: string;
  level: number;
  classTeacherId?: string | null;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("classes").insert({
    school_id: ctx.school.id,
    name: input.name,
    level: input.level,
    class_teacher_id: input.classTeacherId ?? null,
    academic_year: CURRENT_ACADEMIC_YEAR,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/classes");
  return { ok: true };
}

export async function createSubject(input: {
  name: string;
  code?: string;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("subjects").insert({
    school_id: ctx.school.id,
    name: input.name,
    code: input.code ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/subjects");
  return { ok: true };
}

export async function assignSubjectTeacher(input: {
  classId: string;
  subjectId: string;
  teacherId: string;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("class_subject_teachers").upsert(
    {
      school_id: ctx.school.id,
      class_id: input.classId,
      subject_id: input.subjectId,
      teacher_id: input.teacherId,
    },
    { onConflict: "class_id,subject_id" },
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/classes/${input.classId}`);
  return { ok: true };
}

export async function createTimetablePeriod(input: {
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId?: string | null;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("timetable_periods").insert({
    school_id: ctx.school.id,
    class_id: input.classId,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    subject_id: input.subjectId,
    teacher_id: input.teacherId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/timetable");
  return { ok: true };
}

// Move every student in a class up to the next-higher class (by level).
export async function promoteClass(classId: string): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { data: current } = await supabase
    .from("classes")
    .select("id, level")
    .eq("id", classId)
    .single();
  if (!current) return { ok: false, error: "Class not found" };
  const { data: next } = await supabase
    .from("classes")
    .select("id, level")
    .eq("school_id", ctx.school.id)
    .gt("level", current.level)
    .order("level")
    .limit(1)
    .maybeSingle();
  if (!next) return { ok: false, error: "No higher class to promote into" };
  const { error } = await supabase
    .from("students")
    .update({ class_id: next.id })
    .eq("class_id", classId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/promotion");
  return { ok: true };
}

export async function createHomework(input: {
  classId: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { data: hw, error } = await supabase
    .from("homework")
    .insert({
      school_id: ctx.school.id,
      class_id: input.classId,
      subject_id: input.subjectId,
      teacher_id: ctx.user.id,
      title: input.title,
      description: input.description,
      due_date: input.dueDate,
    })
    .select("id")
    .single();
  if (error || !hw) return { ok: false, error: error?.message ?? "Failed" };
  // Create "assigned" submissions for each student in the class.
  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("class_id", input.classId);
  if (students && students.length) {
    await supabase.from("homework_submissions").insert(
      students.map((s) => ({
        homework_id: hw.id,
        student_id: s.id,
        status: "assigned",
      })),
    );
  }
  // Notify the class parents.
  const { data: subject } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", input.subjectId)
    .maybeSingle();
  const emails = await getClassParentEmails(supabase, input.classId);
  await sendHomeworkAssigned(emails, ctx.school.name, {
    title: input.title,
    subject: subject?.name ?? "Homework",
    dueDate: input.dueDate,
  });
  revalidatePath("/teacher/homework");
  return { ok: true };
}
