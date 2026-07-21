import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import { getActivityFeed } from "@/lib/db/montessori";
import { TeacherActivityClient } from "./TeacherActivityClient";

export default async function TeacherActivityPage() {
  const { school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return <TeacherActivityClient students={[]} posts={[]} />;
  }

  const students = await getSchoolStudents(supabase, school.id);
  const posts = await getActivityFeed(supabase, students.map((s) => s.id), null);

  return (
    <TeacherActivityClient
      students={students}
      posts={posts.map((p) => ({
        id: p.id,
        student_id: p.student_id,
        caption: p.caption,
        image_url: p.image_url,
        created_at: p.created_at,
        like_count: p.like_count,
        leaf: p.leaf,
      }))}
    />
  );
}
