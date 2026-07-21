import { RoleShell } from "@/components/roles/RoleShell";
import { SchoolStatusGate } from "@/components/roles/SchoolStatusGate";
import { SchoolThemeProvider } from "@/components/theme/SchoolThemeProvider";
import { requireRole } from "@/lib/auth/context";
import { readTheme } from "@/lib/db/types";
import { shellUserFrom } from "@/lib/auth/shell";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, school } = await requireRole("teacher");
  if (school && school.status !== "active") {
    return (
      <SchoolStatusGate
        schoolName={school.name}
        status={school.status}
        role="teacher"
      />
    );
  }
  return (
    <SchoolThemeProvider theme={school ? readTheme(school.theme) : null}>
      <RoleShell
        role="teacher"
        user={shellUserFrom(user)}
        school={school ? { name: school.name, type: school.type } : null}
      >
        {children}
      </RoleShell>
    </SchoolThemeProvider>
  );
}
