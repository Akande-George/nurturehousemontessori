import { RoleShell } from "@/components/roles/RoleShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShell role="admin">{children}</RoleShell>;
}
