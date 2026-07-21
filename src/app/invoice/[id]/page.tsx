import Link from "next/link";
import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getInvoiceById } from "@/lib/db/operations";
import { getStudentById } from "@/lib/db/students";
import { getSchoolById } from "@/lib/db/schools";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PrintButton } from "@/components/PrintButton";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";

function formatNaira(cents: number): string {
  return `₦${(cents / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return null;

  const invoice = await getInvoiceById(supabase, id);

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-3">
            <h1 className="text-xl font-serif text-slate-900">
              Invoice not found
            </h1>
            <p className="text-sm text-slate-600">
              This invoice link is invalid or no longer available.
            </p>
            <Button asChild variant="outline">
              <Link href="/parent">Return to Parent Portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [student, school] = await Promise.all([
    getStudentById(supabase, invoice.student_id),
    getSchoolById(supabase, invoice.school_id),
  ]);

  const isPaid = invoice.status === "paid";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-10 px-4 print:bg-white print:py-0">
      <Card
        id="invoice"
        className="max-w-3xl w-full border-slate-200 shadow-lg print:shadow-none print:border-none"
      >
        <CardContent className="p-8 sm:p-10 space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-montessori-primary mb-1">
                {school?.name ?? "School"}
              </p>
              <h1 className="text-3xl font-serif text-slate-900">
                {isPaid ? "Receipt" : "Invoice"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">{invoice.id}</p>
            </div>
            <Badge
              variant="outline"
              className={
                isPaid
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 capitalize"
                  : "bg-amber-50 border-amber-200 text-amber-700 capitalize"
              }
            >
              {invoice.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="text-slate-500">Student</p>
              <p className="text-slate-900 font-medium mt-1">
                {student?.name ?? "Unknown Student"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="text-slate-500">Description</p>
              <p className="text-slate-900 font-medium mt-1">
                {invoice.description}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="text-slate-500">Issued</p>
              <p className="text-slate-900 font-medium mt-1">
                {invoice.issued_at.slice(0, 10)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="text-slate-500">Due date</p>
              <p className="text-slate-900 font-medium mt-1">
                {invoice.due_date ?? "—"}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
            <p className="text-slate-600">Total</p>
            <p className="text-3xl font-serif text-slate-900">
              {formatNaira(invoice.amount_cents)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between print:hidden">
            <Button asChild variant="outline">
              <Link href="/parent">Back to portal</Link>
            </Button>
            <div className="flex flex-col sm:flex-row gap-3">
              <DownloadPdfButton targetId="invoice" filename="invoice.pdf" />
              <PrintButton label={isPaid ? "Print receipt" : "Print invoice"} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
