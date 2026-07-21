import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getStudentAttendance } from "@/lib/db/operations";
import type { Attendance } from "@/lib/db/types";
import { ParentAttendanceClient } from "./ParentAttendanceClient";

export default async function ParentAttendancePage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  const children = await getStudentsForParent(supabase!, user.id);

  const records = await getStudentAttendance(
    supabase!,
    children.map((c) => c.id),
  );
  const attendanceByChild: Record<string, Attendance[]> = {};
  children.forEach((c) => {
    attendanceByChild[c.id] = records.filter((r) => r.student_id === c.id);
  });

  return (
    <ParentAttendanceClient
      childrenList={children}
      attendanceByChild={attendanceByChild}
    />
  );
}
