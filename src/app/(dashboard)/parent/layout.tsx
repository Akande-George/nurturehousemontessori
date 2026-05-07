import { RoleShell } from "@/components/roles/RoleShell";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShell role="parent">{children}</RoleShell>;
}
