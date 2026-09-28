import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getTeacherStudents } from "@/lib/db/students";
import { getActivityFeed } from "@/lib/db/montessori";
import { getSchoolCurriculum } from "@/lib/db/curriculum";
import { CURRICULUM } from "@/lib/curriculum/curriculum";
import { TeacherActivityClient } from "./TeacherActivityClient";

export default async function TeacherActivityPage() {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return <TeacherActivityClient
        students={[]}
        posts={[]}
        currentUserId={user.id}
        curriculum={CURRICULUM}
        catalog={CURRICULUM}
      />;
  }

  const students = await getTeacherStudents(supabase, {
    teacherId: user.id,
    schoolId: school.id,
    schoolType: school.type,
  });
  const [posts, { visible, all }] = await Promise.all([
    getActivityFeed(supabase, students.map((s) => s.id), null),
    getSchoolCurriculum(supabase, school.id),
  ]);

  return (
    <TeacherActivityClient
      students={students}
      currentUserId={user.id}
      curriculum={visible}
      catalog={all}
      posts={posts.map((p) => ({
        id: p.id,
        student_id: p.student_id,
        teacher_id: p.teacher_id,
        leaf_id: p.leaf_id,
        caption: p.caption,
        image_url: p.image_url,
        created_at: p.created_at,
        like_count: p.like_count,
        leaf: p.leaf,
      }))}
    />
  );
}
