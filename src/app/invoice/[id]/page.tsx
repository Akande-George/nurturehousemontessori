"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCurrency,
  getStudentById,
  markInvoicePaid,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { downloadStructuredPdf } from "@/lib/pdf/download-pdf";

export default function InvoicePage({ params }: { params: { id: string } }) {
  const store = useDemoStore();

  const invoice = useMemo(
    () => store.invoices.find((item) => item.id === params.id),
    [store, params.id],
  );

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-3">
            <h1 className="text-xl font-serif text-slate-900">
              Invoice not found
            </h1>
            <p className="text-sm text-slate-600">
              This demo invoice link is invalid or expired.
            </p>
            <Button asChild variant="outline">
              <Link href="/parent">Return to Parent Portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const student = getStudentById(invoice.studentId);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-10 px-4">
      <Card className="max-w-3xl w-full border-slate-200 shadow-lg">
        <CardContent className="p-8 sm:p-10 space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif text-slate-900">
                {invoice.status === "paid" ? "Receipt" : "Invoice"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">{invoice.id}</p>
            </div>
            <Badge
              variant="outline"
              className={
                invoice.status === "paid"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
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
                {invoice.issuedAt.slice(0, 10)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="text-slate-500">Due date</p>
              <p className="text-slate-900 font-medium mt-1">
                {invoice.dueDate}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
            <p className="text-slate-600">Total</p>
            <p className="text-3xl font-serif text-slate-900">
              {formatCurrency(invoice.amountCents)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button asChild variant="outline">
              <Link href="/parent">Back to portal</Link>
            </Button>
            {invoice.status === "unpaid" ? (
              <Button
                onClick={() => markInvoicePaid(invoice.id)}
                className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
              >
                Pay now
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={async () => {
                  const student = getStudentById(invoice.studentId);
                  await downloadStructuredPdf({
                    filename: `${invoice.id}.pdf`,
                    header: "Nurture House Montessori",
                    footer: "Thank you for your payment.",
                    lines: [
                      { kind: "title", text: "Receipt" },
                      { kind: "subtitle", text: invoice.id },
                      { kind: "rule" },
                      {
                        kind: "label-value",
                        label: "Student",
                        value: student?.name ?? invoice.studentId,
                      },
                      {
                        kind: "label-value",
                        label: "Date Issued",
                        value: new Date(invoice.issuedAt).toLocaleDateString(
                          "en-NG",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          },
                        ),
                      },
                      { kind: "rule" },
                      {
                        kind: "table",
                        headers: ["Description", "Amount"],
                        rows: [
                          [invoice.description, formatCurrency(invoice.amountCents)],
                        ],
                      },
                      {
                        kind: "label-value",
                        label: "TOTAL PAID",
                        value: formatCurrency(invoice.amountCents),
                      },
                      {
                        kind: "label-value",
                        label: "Status",
                        value: invoice.status.toUpperCase(),
                      },
                    ],
                  });
                }}
              >
                Download receipt
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
