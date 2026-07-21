import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolResources } from "@/lib/db/resources";
import { ResourcesClient } from "./ResourcesClient";

export default async function ResourceLibraryPage() {
  const { school } = await requireRole("parent");
  const supabase = await createClient();
  const resources = school ? await getSchoolResources(supabase!, school.id) : [];
  return <ResourcesClient resources={resources} />;
}
