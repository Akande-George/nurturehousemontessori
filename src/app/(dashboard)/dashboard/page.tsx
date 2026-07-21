import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStats } from "@/lib/db/schools";
import {
  getSchoolNotices,
  getSchoolInvoices,
} from "@/lib/db/operations";
import { getSchoolStudents } from "@/lib/db/students";
import { DashboardClient, type MedicalStudent } from "./DashboardClient";

export default async function DashboardPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [stats, notices, invoices, students] = await Promise.all([
    getSchoolStats(supabase, school.id),
    getSchoolNotices(supabase, school.id),
    getSchoolInvoices(supabase, school.id),
    getSchoolStudents(supabase, school.id),
  ]);

  const outstanding = invoices.filter((i) => i.status === "unpaid").length;

  const medicalStudents: MedicalStudent[] = students
    .filter(
      (s) =>
        s.allergies.length > 0 || (s.medical_notes ?? "").trim().length > 0,
    )
    .map((s) => ({
      id: s.id,
      name: s.name,
      classroom: s.classroom ?? "",
      avatar_color: s.avatar_color,
      allergies: s.allergies,
      medical_notes: s.medical_notes,
    }));

  return (
    <DashboardClient
      stats={{
        studentCount: Number(stats.student_count),
        staffCount: Number(stats.staff_count),
        classCount: Number(stats.class_count),
        outstanding,
      }}
      totalStudents={students.length}
      notices={notices.slice(0, 4)}
      medicalStudents={medicalStudents}
    />
  );
}
