import { RoleShell } from "@/components/roles/RoleShell";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShell role="teacher">{children}</RoleShell>;
}
