import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import { TeacherDailyLogClient, type DailyLog } from "./TeacherDailyLogClient";

export default async function TeacherDailyLogPage() {
  const { school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return <TeacherDailyLogClient students={[]} logs={[]} />;
  }

  const students = await getSchoolStudents(supabase, school.id);
  const { data } = await supabase
    .from("daily_activity_logs")
    .select("id, student_id, log_date, log_time, activity_type, value, notes, created_at")
    .eq("school_id", school.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return <TeacherDailyLogClient students={students} logs={(data ?? []) as DailyLog[]} />;
}
