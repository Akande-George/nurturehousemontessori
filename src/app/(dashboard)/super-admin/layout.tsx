import { RoleShell } from "@/components/roles/RoleShell";
import { requireRole } from "@/lib/auth/context";
import { shellUserFrom } from "@/lib/auth/shell";

// The super-admin console uses the neutral platform palette (the :root
// defaults), so it deliberately does NOT wrap children in SchoolThemeProvider.
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireRole("super_admin");
  return (
    <RoleShell role="super_admin" user={shellUserFrom(user)} school={null}>
      {children}
    </RoleShell>
  );
}
