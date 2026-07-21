import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getStudentInvoices } from "@/lib/db/operations";
import type { Invoice } from "@/lib/db/types";
import { ParentInvoicesClient } from "./ParentInvoicesClient";

export default async function InvoicesPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  const children = await getStudentsForParent(supabase!, user.id);

  const invoices = await getStudentInvoices(
    supabase!,
    children.map((c) => c.id),
  );
  const invoicesByChild: Record<string, Invoice[]> = {};
  children.forEach((c) => {
    invoicesByChild[c.id] = invoices.filter((inv) => inv.student_id === c.id);
  });

  return (
    <ParentInvoicesClient
      childrenList={children}
      invoicesByChild={invoicesByChild}
    />
  );
}
