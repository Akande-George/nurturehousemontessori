import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { Notice, Invoice, Attendance, TimetablePeriod } from "./types";

type DB = SupabaseClient<Database>;

// ---- Notices ----
export async function getSchoolNotices(
  db: DB,
  schoolId: string,
): Promise<Notice[]> {
  const { data } = await db
    .from("notices")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ---- Invoices ----
export async function getStudentInvoices(
  db: DB,
  studentIds: string[],
): Promise<Invoice[]> {
  if (studentIds.length === 0) return [];
  const { data } = await db
    .from("invoices")
    .select("*")
    .in("student_id", studentIds)
    .order("issued_at", { ascending: false });
  return data ?? [];
}

export async function getSchoolInvoices(
  db: DB,
  schoolId: string,
): Promise<Invoice[]> {
  const { data } = await db
    .from("invoices")
    .select("*")
    .eq("school_id", schoolId)
    .order("issued_at", { ascending: false });
  return data ?? [];
}

export async function getInvoiceById(
  db: DB,
  id: string,
): Promise<Invoice | null> {
  const { data } = await db.from("invoices").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

// ---- Attendance ----
export async function getStudentAttendance(
  db: DB,
  studentIds: string[],
): Promise<Attendance[]> {
  if (studentIds.length === 0) return [];
  const { data } = await db
    .from("attendance")
    .select("*")
    .in("student_id", studentIds)
    .order("date", { ascending: false });
  return data ?? [];
}

// Attendance for one child inside a date window (inclusive). Filtered in SQL
// because attendance grows every school day — the progress report calls this
// once for the marking period and once for the academic year.
export async function getStudentAttendanceRange(
  db: DB,
  studentId: string,
  from: string,
  to: string,
): Promise<Attendance[]> {
  const { data } = await db
    .from("attendance")
    .select("*")
    .eq("student_id", studentId)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });
  return data ?? [];
}

export async function getAttendanceForDate(
  db: DB,
  schoolId: string,
  date: string,
): Promise<Attendance[]> {
  const { data } = await db
    .from("attendance")
    .select("*")
    .eq("school_id", schoolId)
    .eq("date", date);
  return data ?? [];
}

// ---- Calendar ----
export type CalendarEvent =
  Database["public"]["Tables"]["calendar_events"]["Row"];

export async function getCalendarEvents(
  db: DB,
  schoolId: string,
): Promise<CalendarEvent[]> {
  const { data } = await db
    .from("calendar_events")
    .select("*")
    .eq("school_id", schoolId)
    .order("starts_at");
  return data ?? [];
}

// ---- Enrollment applications ----
export type EnrollmentApplication =
  Database["public"]["Tables"]["enrollment_applications"]["Row"];

export async function getSchoolApplications(
  db: DB,
  schoolId: string,
): Promise<EnrollmentApplication[]> {
  const { data } = await db
    .from("enrollment_applications")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ---- After-school ----
export async function getAfterSchoolEnrollments(
  db: DB,
  schoolId: string,
): Promise<{ student_id: string }[]> {
  const { data } = await db
    .from("after_school_enrollments")
    .select("student_id")
    .eq("school_id", schoolId);
  return data ?? [];
}

// ---- Timetable ----
export async function getTimetable(
  db: DB,
  classId: string,
): Promise<TimetablePeriod[]> {
  const { data } = await db
    .from("timetable_periods")
    .select("*")
    .eq("class_id", classId)
    .order("day_of_week")
    .order("start_time");
  return data ?? [];
}
