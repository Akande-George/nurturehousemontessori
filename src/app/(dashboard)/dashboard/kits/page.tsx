import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getClasses } from "@/lib/db/classes";
import { getSchoolKitItems } from "@/lib/db/resources";
import { KitsClient } from "./KitsClient";

export default async function SchoolKitPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [classes, kitItems] = await Promise.all([
    getClasses(supabase, school.id),
    getSchoolKitItems(supabase, school.id),
  ]);

  return (
    <KitsClient
      schoolName={school.name}
      schoolType={school.type}
      classes={classes}
      kitItems={kitItems}
    />
  );
}
