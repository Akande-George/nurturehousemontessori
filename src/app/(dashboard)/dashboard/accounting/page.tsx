import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolInvoices } from "@/lib/db/operations";
import { getSchoolStudents } from "@/lib/db/students";
import { AccountingClient } from "./AccountingClient";

export default async function AccountingPage() {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const [invoices, students] = await Promise.all([
    getSchoolInvoices(supabase, school.id),
    getSchoolStudents(supabase, school.id),
  ]);

  const studentOptions = students.map((s) => ({ id: s.id, name: s.name }));

  return (
    <AccountingClient invoices={invoices} students={studentOptions} />
  );
}
