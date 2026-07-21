import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import { getActivityFeed } from "@/lib/db/montessori";
import { GalleryClient, type GalleryItem } from "./GalleryClient";

export default async function GalleryPage() {
  const { school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) return <GalleryClient items={[]} />;

  const students = await getSchoolStudents(supabase, school.id);
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const posts = await getActivityFeed(supabase, students.map((s) => s.id), null);

  const items: GalleryItem[] = posts
    .filter((p) => !!p.image_url)
    .map((p) => {
      const student = studentMap.get(p.student_id);
      return {
        id: p.id,
        imageUrl: p.image_url as string,
        caption: p.caption,
        createdAt: p.created_at,
        studentName: student?.name ?? "Unknown",
        areaName: p.leaf?.areaName ?? null,
        activityName: p.leaf?.activityName ?? null,
      };
    });

  return <GalleryClient items={items} />;
}
