import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getActivityFeed } from "@/lib/db/montessori";
import { getCatalogsForSchools } from "@/lib/db/curriculum";
import { CURRICULUM, type Area } from "@/lib/curriculum/curriculum";
import { ParentFeedClient, type FeedPost } from "./ParentFeedClient";

export default async function ParentDashboardPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  if (!supabase) {
    return <ParentFeedClient children={[]} posts={[]} parentFirstName="" curriculum={CURRICULUM} />;
  }

  const children = await getStudentsForParent(supabase, user.id);
  // Each child's school may have its own curriculum; the area filter offers the
  // areas of all of them (full catalogs, so older posts stay filterable).
  const catalogs = await getCatalogsForSchools(supabase, children.map((c) => c.school_id));
  const only = catalogs.size === 1 ? [...catalogs.values()][0].all : undefined;
  const feed = await getActivityFeed(supabase, children.map((c) => c.id), user.id, only);

  const seen = new Set<string>();
  const curriculum: Area[] = [];
  for (const { all } of catalogs.values()) {
    for (const area of all) {
      if (seen.has(area.name)) continue;
      seen.add(area.name);
      curriculum.push(area);
    }
  }

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
      curriculum={curriculum}
    />
  );
}
