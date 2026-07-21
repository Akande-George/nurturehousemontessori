import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import { getAttendanceForDate } from "@/lib/db/operations";
import { AttendanceClient } from "./AttendanceClient";

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const { date: dateParam } = await searchParams;
  const date = dateParam ?? new Date().toISOString().slice(0, 10);

  const [students, attendance] = await Promise.all([
    getSchoolStudents(supabase, school.id),
    getAttendanceForDate(supabase, school.id, date),
  ]);

  return (
    <AttendanceClient students={students} attendance={attendance} date={date} />
  );
}
