import { requireRole } from "@/lib/auth/context";
import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import { getPortalRoster } from "@/lib/db/invites";
import { InvitesClient } from "./InvitesClient";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default async function PortalInvitesPage() {
  const { school } = await requireRole("admin");
  if (!school) return null;

  const admin = createAdminClient();
  const supabase = await createClient();
  const [roster, students] = await Promise.all([
    getPortalRoster(admin, school.id),
    getSchoolStudents(supabase!, school.id),
  ]);

  return (
    <InvitesClient
      roster={roster}
      students={students.map((s) => ({ id: s.id, name: s.name }))}
      loginUrl={`${APP_URL}/login`}
    />
  );
}
