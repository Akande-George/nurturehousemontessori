"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";
import {
  getSchoolParentEmails,
  getStudentParentEmails,
  getSchoolStaffEmails,
} from "@/lib/db/people";
import {
  sendNoticeFanout,
  sendInvoiceIssued,
  sendAbsenceAlert,
  sendAfterSchoolConfirm,
} from "@/lib/email/notifications";
import { formatNaira } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/db/types";

type Result = { ok: boolean; error?: string };

async function ctxClient() {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  return { ctx, supabase };
}

// Post a notice to the current school's board (admin/staff).
export async function createNotice(input: {
  title: string;
  content: string;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("notices").insert({
    school_id: ctx.school.id,
    title: input.title,
    content: input.content,
    author_id: ctx.user.id,
    audience: "all-parents",
  });
  if (error) return { ok: false, error: error.message };
  // Best-effort email fan-out to parents (never fails the mutation).
  const emails = await getSchoolParentEmails(supabase, ctx.school.id);
  await sendNoticeFanout(emails, ctx.school.name, {
    title: input.title,
    content: input.content,
  });
  revalidatePath("/dashboard");
  revalidatePath("/parent/notices");
  return { ok: true };
}

export async function markNoticeRead(noticeId: string): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx || !supabase) return { ok: false, error: "Not authorized" };
  await supabase
    .from("notice_reads")
    .upsert(
      { notice_id: noticeId, parent_id: ctx.user.id },
      { onConflict: "notice_id,parent_id" },
    );
  return { ok: true };
}

export async function createInvoice(input: {
  studentId: string;
  parentId?: string | null;
  description: string;
  amountCents: number;
  dueDate: string;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      school_id: ctx.school.id,
      student_id: input.studentId,
      parent_id: input.parentId ?? null,
      description: input.description,
      amount_cents: input.amountCents,
      due_date: input.dueDate,
      status: "unpaid",
    })
    .select("id")
    .single();
  if (error || !invoice) return { ok: false, error: error?.message ?? "Failed" };
  const emails = await getStudentParentEmails(supabase, input.studentId);
  await Promise.all(
    emails.map((email) =>
      sendInvoiceIssued(email, ctx.school!.name, {
        description: input.description,
        amount: formatNaira(input.amountCents),
        dueDate: input.dueDate,
        invoiceId: invoice.id,
      }),
    ),
  );
  revalidatePath("/dashboard/accounting");
  revalidatePath("/parent/invoices");
  return { ok: true };
}

export async function markInvoicePaid(invoiceId: string): Promise<Result> {
  const { supabase } = await ctxClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", invoiceId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/accounting");
  revalidatePath("/parent/invoices");
  return { ok: true };
}

export async function createCalendarEvent(input: {
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  type?: string;
  audience?: string;
  allDay?: boolean;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("calendar_events").insert({
    school_id: ctx.school.id,
    title: input.title,
    description: input.description ?? null,
    location: input.location ?? null,
    starts_at: input.startsAt,
    ends_at: input.endsAt ?? null,
    type: input.type ?? "academic",
    audience: input.audience ?? "public",
    all_day: input.allDay ?? false,
    created_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/calendar");
  revalidatePath("/parent/calendar");
  return { ok: true };
}

export async function enrollAfterSchool(studentId: string): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("after_school_enrollments").upsert(
    { school_id: ctx.school.id, student_id: studentId, parent_id: ctx.user.id },
    { onConflict: "student_id" },
  );
  if (error) return { ok: false, error: error.message };
  await afterSchoolNotify(supabase, ctx.school.id, ctx.school.name, studentId, true);
  revalidatePath("/parent/after-school");
  revalidatePath("/dashboard/after-school");
  return { ok: true };
}

export async function unenrollAfterSchool(studentId: string): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase
    .from("after_school_enrollments")
    .delete()
    .eq("student_id", studentId);
  if (error) return { ok: false, error: error.message };
  await afterSchoolNotify(supabase, ctx.school.id, ctx.school.name, studentId, false);
  revalidatePath("/parent/after-school");
  revalidatePath("/dashboard/after-school");
  return { ok: true };
}

async function afterSchoolNotify(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  schoolId: string,
  schoolName: string,
  studentId: string,
  enrolled: boolean,
) {
  const [parents, admins, student] = await Promise.all([
    getStudentParentEmails(supabase, studentId),
    getSchoolStaffEmails(supabase, schoolId),
    supabase.from("students").select("name").eq("id", studentId).maybeSingle(),
  ]);
  const recipients = Array.from(new Set([...parents, ...admins]));
  await sendAfterSchoolConfirm(recipients, schoolName, {
    studentName: student.data?.name ?? "A student",
    enrolled,
  });
}

export async function recordAttendance(input: {
  studentId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}): Promise<Result> {
  const { ctx, supabase } = await ctxClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("attendance").upsert(
    {
      school_id: ctx.school.id,
      student_id: input.studentId,
      date: input.date,
      status: input.status,
      notes: input.notes ?? null,
      recorded_by: ctx.user.id,
    },
    { onConflict: "student_id,date" },
  );
  if (error) return { ok: false, error: error.message };
  if (input.status === "absent") {
    const [emails, student] = await Promise.all([
      getStudentParentEmails(supabase, input.studentId),
      supabase.from("students").select("name").eq("id", input.studentId).maybeSingle(),
    ]);
    await sendAbsenceAlert(emails, ctx.school.name, {
      studentName: student.data?.name ?? "Your child",
      date: input.date,
    });
  }
  revalidatePath("/teacher/attendance");
  revalidatePath("/dashboard/attendance");
  return { ok: true };
}
