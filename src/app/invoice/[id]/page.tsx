import Link from "next/link";
import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getInvoiceById } from "@/lib/db/operations";
import { getStudentById } from "@/lib/db/students";
import { getSchoolById } from "@/lib/db/schools";
import { getStudentParentProfiles } from "@/lib/db/people";
import { invoiceLineItems, invoicePayment } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PrintButton } from "@/components/PrintButton";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";

// Plain figure like the printed invoice uses in table cells, e.g. 200,000
function fmtAmount(cents: number): string {
  return (cents / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// DD/MM/YYYY, matching the school's paper invoice.
function fmtDate(iso: string): string {
  if (!iso) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB");
  }
  return new Date(iso).toLocaleDateString("en-GB");
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

  const [student, school, parents] = await Promise.all([
    getStudentById(supabase, invoice.student_id),
    getSchoolById(supabase, invoice.school_id),
    getStudentParentProfiles(supabase, invoice.student_id),
  ]);

  const payment = invoicePayment(invoice);
  const isPaid = payment.state === "paid";
  // Any money received turns the document into a receipt, not just full payment.
  const isReceipt = payment.paid > 0;
  const docLabel = isReceipt ? "receipt" : "invoice";
  const items = invoiceLineItems(invoice);
  const taxCents = invoice.tax_cents ?? 0;
  const subtotalCents = items.reduce((sum, item) => sum + item.amount_cents, 0);
  const billTo =
    parents.find((p) => p.id === invoice.parent_id) ?? parents[0] ?? null;
  const invoiceNo = invoice.invoice_no ?? invoice.id.slice(0, 8).toUpperCase();
  // Pad the table with blank rows so short invoices keep the paper-form look.
  const fillerRows = Math.max(0, 4 - items.length);

  const contactBits = [
    school?.phone ? `Phone: ${school.phone}` : null,
    school?.contact_email ? `Email: ${school.contact_email}` : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/parent">Back to portal</Link>
            </Button>
            <Badge
              variant="outline"
              className={
                isPaid
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : payment.state === "part_paid"
                    ? "bg-sky-50 border-sky-200 text-sky-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
              }
            >
              {isPaid
                ? "Paid"
                : payment.state === "part_paid"
                  ? "Part paid"
                  : "Unpaid"}
            </Badge>
          </div>
          <div className="flex gap-3">
            <DownloadPdfButton
              targetId="invoice"
              filename={`${invoiceNo.replace(/\//g, "-")}-${docLabel}.pdf`}
            />
            <PrintButton label={isReceipt ? "Print receipt" : "Print invoice"} />
          </div>
        </div>

        <Card
          id="invoice"
          className="w-full border-slate-200 shadow-lg print:shadow-none print:border-none"
        >
          <CardContent className="p-8 sm:p-12 bg-white">
            {/* Letterhead */}
            <div className="flex items-start justify-between gap-4">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={school?.logo_url ?? "/logo2.png"}
                  alt={school?.name ?? "School logo"}
                  className="h-16 w-auto object-contain"
                />
                <p className="text-sm font-semibold text-montessori-primary mt-2 max-w-[200px] leading-snug">
                  {school?.name ?? "School"}
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-wide text-slate-500">
                {isReceipt ? "RECEIPT" : "INVOICE"}
              </h1>
            </div>

            {/* Date / Bill To / Invoice # */}
            <div className="mt-8 text-sm text-slate-800">
              <p className="text-right">Date: {fmtDate(invoice.issued_at)}</p>
              <div className="mt-4 flex justify-between items-start">
                <p className="font-bold">Bill To</p>
                <div className="text-right space-y-0.5">
                  <p>{billTo?.full_name || "Parent / Guardian"}</p>
                  {billTo?.email && (
                    <p className="text-slate-600">{billTo.email}</p>
                  )}
                  <p className="pt-2">
                    INVOICE # <span className="font-medium">{invoiceNo}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Payment date + coverage + amount */}
            <div className="mt-10 flex justify-center">
              <div className="grid grid-cols-[auto_auto] gap-x-10 gap-y-1 text-sm text-slate-800">
                {(invoice.period_start || invoice.period_end) && (
                  <>
                    <p className="font-medium">Period Covered:</p>
                    <p className="text-right">
                      {invoice.period_start && invoice.period_end
                        ? `${fmtDate(invoice.period_start)} – ${fmtDate(invoice.period_end)}`
                        : fmtDate((invoice.period_start ?? invoice.period_end)!)}
                    </p>
                  </>
                )}
                <p className="font-medium">Payment Date:</p>
                <p className="text-right">
                  {invoice.due_date ? fmtDate(invoice.due_date) : "—"}
                </p>
                <p className="font-medium">Amount:</p>
                <p className="text-right">₦{fmtAmount(invoice.amount_cents)}</p>
              </div>
            </div>

            {/* Line items */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm text-slate-800">
                <thead>
                  <tr>
                    <th className="border border-slate-300 px-3 py-2.5 text-left font-bold w-14">
                      No
                    </th>
                    <th className="border border-slate-300 px-3 py-2.5 text-left font-bold">
                      Description{" "}
                      <span className="font-normal">
                        ({student?.name ?? "Student"})
                      </span>
                    </th>
                    <th className="border border-slate-300 px-3 py-2.5 text-left font-bold w-32">
                      Unit Price
                    </th>
                    <th className="border border-slate-300 px-3 py-2.5 text-left font-bold w-32">
                      Line Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-slate-300 px-3 py-2">
                        {index + 1}.
                      </td>
                      <td className="border border-slate-300 px-3 py-2">
                        {item.description}
                      </td>
                      <td className="border border-slate-300 px-3 py-2">
                        {fmtAmount(item.amount_cents)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2">
                        {fmtAmount(item.amount_cents)}
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: fillerRows }).map((_, index) => (
                    <tr key={`filler-${index}`}>
                      <td className="border border-slate-300 px-3 py-4">
                        &nbsp;
                      </td>
                      <td className="border border-slate-300 px-3 py-4" />
                      <td className="border border-slate-300 px-3 py-4" />
                      <td className="border border-slate-300 px-3 py-4" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-2 flex justify-end">
              <div className="w-72 text-sm text-slate-800">
                <div className="flex justify-between px-3 py-2 border border-slate-300 border-t-0">
                  <p>Subtotal</p>
                  <p>{fmtAmount(subtotalCents)}</p>
                </div>
                {(invoice.discount_cents ?? 0) > 0 && (
                  <div className="flex justify-between px-3 py-2 border border-slate-300 border-t-0 text-emerald-700 font-medium">
                    <p>Discount</p>
                    <p>-₦{fmtAmount(invoice.discount_cents)}</p>
                  </div>
                )}
                <div className="flex justify-between px-3 py-2 border border-slate-300 border-t-0">
                  <p>Tax</p>
                  <p>{fmtAmount(taxCents)}</p>
                </div>
                <div className="flex justify-between px-3 py-2 border border-slate-300 border-t-0 font-bold">
                  <p>Total</p>
                  <p>₦{fmtAmount(invoice.amount_cents)}</p>
                </div>
                {isReceipt && (
                  <div className="flex justify-between px-3 py-2 border border-slate-300 border-t-0 text-emerald-700">
                    <p>Amount Paid</p>
                    <p>₦{fmtAmount(payment.paid)}</p>
                  </div>
                )}
                <div
                  className={`flex justify-between px-3 py-2 border border-slate-300 border-t-0 font-bold ${
                    payment.balance > 0 ? "bg-amber-50" : "bg-emerald-50"
                  }`}
                >
                  <p>{payment.balance > 0 ? "Balance Due" : "Balance"}</p>
                  <p>₦{fmtAmount(payment.balance)}</p>
                </div>
              </div>
            </div>

            {/* Balance deadline + remarks */}
            {(payment.balanceDueDate || payment.note) && (
              <div className="mt-6 space-y-3 text-sm text-slate-800">
                {payment.balanceDueDate && (
                  <p className="font-medium">
                    Balance of ₦{fmtAmount(payment.balance)} is due by{" "}
                    {fmtDate(payment.balanceDueDate)}.
                  </p>
                )}
                {payment.note && (
                  <div className="border border-slate-300 px-3 py-2">
                    <p className="font-bold">Remarks</p>
                    <p className="whitespace-pre-line">{payment.note}</p>
                  </div>
                )}
              </div>
            )}

            {/* Payment instructions */}
            <div className="mt-10 text-center text-sm text-slate-800 space-y-0.5">
              {(school?.bank_account_number || school?.bank_name) && (
                <>
                  <p>Please make all payments to</p>
                  <p className="font-medium">
                    {school?.bank_account_name || school?.name}
                  </p>
                  {school?.bank_account_number && (
                    <p>{school.bank_account_number}</p>
                  )}
                  {school?.bank_name && <p>{school.bank_name}</p>}
                </>
              )}
              <p className="font-serif font-semibold italic pt-3">
                Thank you for your patronage!
              </p>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 space-y-0.5">
              <p>
                {school?.name}
                {school?.address ? `, ${school.address}` : ""}
              </p>
              {contactBits.length > 0 && <p>{contactBits.join("  ")}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
