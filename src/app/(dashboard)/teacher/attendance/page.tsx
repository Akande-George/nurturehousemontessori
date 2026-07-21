import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getTeacherClasses } from "@/lib/db/classes";
import { getClassStudents } from "@/lib/db/students";
import { getAttendanceForDate } from "@/lib/db/operations";
import { AttendanceClient } from "./AttendanceClient";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; classId?: string }>;
}) {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  const db = supabase!;

  const classes = await getTeacherClasses(db, user.id, school!.id);
  const sp = await searchParams;

  const date = sp.date ?? todayIso();
  const classId =
    sp.classId && classes.some((c) => c.id === sp.classId)
      ? sp.classId
      : classes[0]?.id ?? "";

  const [students, attendance] = await Promise.all([
    classId ? getClassStudents(db, classId) : Promise.resolve([]),
    getAttendanceForDate(db, school!.id, date),
  ]);

  return (
    <AttendanceClient
      classes={classes}
      students={students}
      attendance={attendance}
      date={date}
      classId={classId}
    />
  );
}
