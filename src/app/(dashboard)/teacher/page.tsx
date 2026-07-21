import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import {
  getSchoolObservations,
  getActivityFeed,
} from "@/lib/db/montessori";
import { TeacherHomeClient } from "./TeacherHomeClient";

export default async function TeacherDashboardPage() {
  const { school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) return <TeacherHomeClient students={[]} recentObs={[]} obsCountByStudent={{}} postCountByStudent={{}} totalObs={0} totalPosts={0} schoolName="" />;

  const students = await getSchoolStudents(supabase, school.id);
  const [observations, feed] = await Promise.all([
    getSchoolObservations(supabase, school.id),
    getActivityFeed(supabase, students.map((s) => s.id), null),
  ]);

  const obsCountByStudent: Record<string, number> = {};
  for (const o of observations) {
    obsCountByStudent[o.student_id] = (obsCountByStudent[o.student_id] ?? 0) + 1;
  }
  const postCountByStudent: Record<string, number> = {};
  for (const p of feed) {
    postCountByStudent[p.student_id] = (postCountByStudent[p.student_id] ?? 0) + 1;
  }

  const recentObs = observations.slice(0, 4).map((o) => ({
    id: o.id,
    student_id: o.student_id,
    content: o.content,
    created_at: o.created_at,
    leaf: o.leaf,
  }));

  return (
    <TeacherHomeClient
      students={students}
      recentObs={recentObs}
      obsCountByStudent={obsCountByStudent}
      postCountByStudent={postCountByStudent}
      totalObs={observations.length}
      totalPosts={feed.length}
      schoolName={school.name}
    />
  );
}
