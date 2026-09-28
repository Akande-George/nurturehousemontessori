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

// Editing/removing school structure (classes, subjects, timetable) is an admin
// job; the pages that expose it are admin-only too.
async function adminCtx() {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx || ctx.role !== "admin" || !ctx.school || !supabase) return null;
  return { schoolId: ctx.school.id, supabase };
}

// Class and subject names appear on almost every staff and parent screen, so a
// rename or removal refreshes all three areas.
function revalidateAcademics() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/teacher", "layout");
  revalidatePath("/parent", "layout");
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

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

export async function updateClass(
  id: string,
  input: { name: string; level: number; classTeacherId?: string | null },
): Promise<Result> {
  const c = await adminCtx();
  if (!c) return { ok: false, error: "Not authorized" };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a class name." };
  if (!Number.isInteger(input.level)) {
    return { ok: false, error: "Level must be a whole number." };
  }
  const { data, error } = await c.supabase
    .from("classes")
    .update({
      name,
      level: input.level,
      class_teacher_id: input.classTeacherId ?? null,
    })
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Class not found." };
  revalidateAcademics();
  return { ok: true };
}

export async function deleteClass(id: string): Promise<Result> {
  const c = await adminCtx();
  if (!c) return { ok: false, error: "Not authorized" };

  const { data: current } = await c.supabase
    .from("classes")
    .select("id, name")
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .maybeSingle();
  if (!current) return { ok: false, error: "Class not found." };

  // Refuse while students are still enrolled rather than leaving them
  // without a class.
  const { count: students } = await c.supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("school_id", c.schoolId)
    .eq("class_id", id);
  if (students) {
    return {
      ok: false,
      error: `${plural(students, "student is", "students are")} still in ${current.name}. Move them to another class first.`,
    };
  }

  // Scores and report cards cascade with the class, so a class with grade
  // history (e.g. one whose students were promoted out) is kept.
  const [{ count: scores }, { count: cards }] = await Promise.all([
    c.supabase
      .from("assessment_scores")
      .select("id", { count: "exact", head: true })
      .eq("class_id", id),
    c.supabase
      .from("report_cards")
      .select("id", { count: "exact", head: true })
      .eq("class_id", id),
  ]);
  if (scores || cards) {
    return {
      ok: false,
      error: `${current.name} has recorded scores or report cards. Deleting it would erase that grade history, so it can't be removed.`,
    };
  }

  // Timetable periods, homework and subject-teacher assignments cascade.
  const { error } = await c.supabase
    .from("classes")
    .delete()
    .eq("id", id)
    .eq("school_id", c.schoolId);
  if (error) return { ok: false, error: error.message };
  revalidateAcademics();
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

export async function updateSubject(
  id: string,
  input: { name: string; code?: string },
): Promise<Result> {
  const c = await adminCtx();
  if (!c) return { ok: false, error: "Not authorized" };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a subject name." };
  const { data, error } = await c.supabase
    .from("subjects")
    .update({ name, code: input.code?.trim() || null })
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Subject not found." };
  revalidateAcademics();
  return { ok: true };
}

export async function deleteSubject(id: string): Promise<Result> {
  const c = await adminCtx();
  if (!c) return { ok: false, error: "Not authorized" };

  const { data: current } = await c.supabase
    .from("subjects")
    .select("id, name")
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .maybeSingle();
  if (!current) return { ok: false, error: "Subject not found." };

  // Scores and published report-card rows cascade with the subject; refuse
  // rather than silently erase grade data.
  const [{ count: scores }, { count: cardRows }] = await Promise.all([
    c.supabase
      .from("assessment_scores")
      .select("id", { count: "exact", head: true })
      .eq("subject_id", id),
    c.supabase
      .from("report_card_rows")
      .select("id", { count: "exact", head: true })
      .eq("subject_id", id),
  ]);
  if (scores || cardRows) {
    return {
      ok: false,
      error: `${current.name} has recorded scores or appears on report cards. Deleting it would erase that grade data, so it can't be removed.`,
    };
  }

  // Subject-teacher assignments cascade; timetable periods and homework keep
  // their slot with the subject cleared.
  const { error } = await c.supabase
    .from("subjects")
    .delete()
    .eq("id", id)
    .eq("school_id", c.schoolId);
  if (error) return { ok: false, error: error.message };
  revalidateAcademics();
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
  const invalid = periodTimeError(input.startTime, input.endTime);
  if (invalid) return { ok: false, error: invalid };
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

// "HH:MM" strings from <input type="time"> compare correctly as text.
function periodTimeError(startTime: string, endTime: string) {
  if (!startTime || !endTime) return "Enter a start and end time.";
  if (endTime <= startTime) return "The period must end after it starts.";
  return null;
}

function revalidateTimetable() {
  revalidatePath("/dashboard/timetable");
  revalidatePath("/teacher/timetable");
  revalidatePath("/parent/timetable");
}

export async function updateTimetablePeriod(
  id: string,
  input: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subjectId: string;
    teacherId?: string | null;
  },
): Promise<Result> {
  const c = await adminCtx();
  if (!c) return { ok: false, error: "Not authorized" };
  const invalid = periodTimeError(input.startTime, input.endTime);
  if (invalid) return { ok: false, error: invalid };
  if (input.dayOfWeek < 1 || input.dayOfWeek > 5) {
    return { ok: false, error: "Pick a day from Monday to Friday." };
  }
  const { data, error } = await c.supabase
    .from("timetable_periods")
    .update({
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      subject_id: input.subjectId,
      teacher_id: input.teacherId ?? null,
    })
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Period not found." };
  revalidateTimetable();
  return { ok: true };
}

export async function deleteTimetablePeriod(id: string): Promise<Result> {
  const c = await adminCtx();
  if (!c) return { ok: false, error: "Not authorized" };
  const { data, error } = await c.supabase
    .from("timetable_periods")
    .delete()
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Period not found." };
  revalidateTimetable();
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

// Homework can be changed by the teacher who set it, or by a school admin.
async function homeworkEditCtx(id: string) {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { error: "Not authorized" } as const;
  const { data: hw } = await supabase
    .from("homework")
    .select("id, teacher_id")
    .eq("id", id)
    .eq("school_id", ctx.school.id)
    .maybeSingle();
  if (!hw) return { error: "Homework not found." } as const;
  if (ctx.role !== "admin" && hw.teacher_id !== ctx.user.id) {
    return { error: "Only the teacher who set this homework can change it." } as const;
  }
  return { ctx, supabase, schoolId: ctx.school.id } as const;
}

// Edits are silent: parents were emailed when it was assigned, and the
// per-student submissions are left untouched.
export async function updateHomework(
  id: string,
  input: {
    subjectId: string;
    title: string;
    description: string;
    dueDate: string;
  },
): Promise<Result> {
  const c = await homeworkEditCtx(id);
  if ("error" in c) return { ok: false, error: c.error };
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Enter a title." };
  if (!input.dueDate) return { ok: false, error: "Pick a due date." };
  const { error } = await c.supabase
    .from("homework")
    .update({
      subject_id: input.subjectId,
      title,
      description: input.description.trim(),
      due_date: input.dueDate,
    })
    .eq("id", id)
    .eq("school_id", c.schoolId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/teacher/homework");
  revalidatePath("/parent/homework");
  return { ok: true };
}

// Submissions cascade with the homework.
export async function deleteHomework(id: string): Promise<Result> {
  const c = await homeworkEditCtx(id);
  if ("error" in c) return { ok: false, error: c.error };
  const { error } = await c.supabase
    .from("homework")
    .delete()
    .eq("id", id)
    .eq("school_id", c.schoolId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/teacher/homework");
  revalidatePath("/parent/homework");
  return { ok: true };
}
