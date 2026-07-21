import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getActivityFeed } from "@/lib/db/montessori";
import { ParentFeedClient, type FeedPost } from "./ParentFeedClient";

export default async function ParentDashboardPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  if (!supabase) return <ParentFeedClient children={[]} posts={[]} parentFirstName="" />;

  const children = await getStudentsForParent(supabase, user.id);
  const feed = await getActivityFeed(supabase, children.map((c) => c.id), user.id);

  const posts: FeedPost[] = feed.map((p) => ({
    id: p.id,
    student_id: p.student_id,
    caption: p.caption,
    image_url: p.image_url,
    created_at: p.created_at,
    like_count: p.like_count,
    liked_by_me: p.liked_by_me,
    leaf: p.leaf,
  }));

  return (
    <ParentFeedClient
      children={children}
      posts={posts}
      parentFirstName={user.full_name?.split(" ")[0] ?? ""}
    />
  );
}
