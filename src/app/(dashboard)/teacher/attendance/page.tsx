import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getTeacherClasses } from "@/lib/db/classes";
import { getTeacherClassrooms } from "@/lib/db/classrooms";
import { getClassStudents, getTeacherStudents } from "@/lib/db/students";
import { getAttendanceForDate } from "@/lib/db/operations";
import type { Student } from "@/lib/db/types";
import { AttendanceClient } from "./AttendanceClient";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; groupId?: string }>;
}) {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  const db = supabase!;
  const sp = await searchParams;

  const date = sp.date ?? todayIso();
  const isMontessori = school!.type === "montessori";
  const groupNoun = isMontessori ? "classroom" : "class";

  // Only what this teacher is assigned: classrooms (Montessori) or classes
  // (regular). Nothing assigned means nothing to mark.
  const groups = isMontessori
    ? (await getTeacherClassrooms(db, user.id, school!.id)).map((name) => ({
        id: name,
        name,
      }))
    : (await getTeacherClasses(db, user.id, school!.id)).map((c) => ({
        id: c.id,
        name: c.name,
      }));

  const groupId = groups.some((g) => g.id === sp.groupId)
    ? sp.groupId!
    : groups[0]?.id ?? "";

  const [assignedStudents, dayAttendance] = await Promise.all([
    groupId
      ? isMontessori
        ? getTeacherStudents(db, {
            teacherId: user.id,
            schoolId: school!.id,
            schoolType: school!.type,
          })
        : getClassStudents(db, groupId)
      : Promise.resolve<Student[]>([]),
    getAttendanceForDate(db, school!.id, date),
  ]);

  const students = isMontessori
    ? assignedStudents.filter((s) => (s.classroom ?? "") === groupId)
    : assignedStudents;

  // Only this roster's records — another room's attendance is not this
  // teacher's business.
  const rosterIds = new Set(students.map((s) => s.id));
  const attendance = dayAttendance.filter((r) => rosterIds.has(r.student_id));

  return (
    <AttendanceClient
      groups={groups}
      students={students}
      attendance={attendance}
      date={date}
      groupId={groupId}
      groupNoun={groupNoun}
    />
  );
}
