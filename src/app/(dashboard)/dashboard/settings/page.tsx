import { requireRole } from "@/lib/auth/context";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const { school } = await requireRole("admin");
  if (!school) return null;
  return <SettingsClient school={school} />;
}
