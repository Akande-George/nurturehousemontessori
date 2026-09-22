import { requireRole } from "@/lib/auth/context";
import { createAdminClient } from "@/supabase/admin";
import { getSchoolStaff } from "@/lib/db/staff";
import { getClassrooms } from "@/lib/db/classrooms";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const { school, user } = await requireRole("admin");
  if (!school) return null;
  const admin = createAdminClient();
  const [staff, classrooms] = await Promise.all([
    getSchoolStaff(admin, school.id),
    getClassrooms(admin, school.id),
  ]);
  return (
    <SettingsClient
      school={school}
      staff={staff}
      currentUserId={user.id}
      classrooms={classrooms}
    />
  );
}
