import type { Profile } from "@/lib/db/types";
import type { ShellUser } from "@/components/roles/RoleShell";

// Build the RoleShell user props from a profile row.
export function shellUserFrom(user: Profile): ShellUser {
  const name = user.full_name?.trim() || user.email;
  return {
    name,
    email: user.email,
    initial: (name || "?").trim()[0]?.toUpperCase() ?? "?",
  };
}
