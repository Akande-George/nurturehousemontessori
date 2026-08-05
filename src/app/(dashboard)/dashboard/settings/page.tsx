import { requireRole } from "@/lib/auth/context";
import { createAdminClient } from "@/supabase/admin";
import { getSchoolStaff } from "@/lib/db/staff";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const { school, user } = await requireRole("admin");
  if (!school) return null;
  const staff = await getSchoolStaff(createAdminClient(), school.id);
  return <SettingsClient school={school} staff={staff} currentUserId={user.id} />;
}
