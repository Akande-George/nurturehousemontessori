import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolResources } from "@/lib/db/resources";
import { ResourcesAdminClient } from "./ResourcesAdminClient";

export default async function ResourcesAdminPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  const resources = school ? await getSchoolResources(supabase!, school.id) : [];
  return <ResourcesAdminClient resources={resources} />;
}
