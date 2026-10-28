"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Filter } from "lucide-react";
import {
  invoicePayment,
  INVOICE_STATE_LABEL,
  type Invoice,
  type Student,
} from "@/lib/db/types";

function formatCurrency(amountCents: number) {
  return `₦${(amountCents / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ParentInvoicesClient({
  childrenList,
  invoicesByChild,
}: {
  childrenList: Student[];
  invoicesByChild: Record<string, Invoice[]>;
}) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "paid">(
    "all",
  );

  const effectiveChildId =
    selectedChildId && childrenList.some((c) => c.id === selectedChildId)
      ? selectedChildId
      : childrenList[0]?.id ?? null;

  const selectedChild = effectiveChildId
    ? childrenList.find((c) => c.id === effectiveChildId) ?? null
    : null;
  const allInvoices = selectedChild
    ? invoicesByChild[selectedChild.id] ?? []
    : [];

  const filteredInvoices = useMemo(() => {
    if (statusFilter === "all") return allInvoices;
    // A part-paid invoice still owes money, so it belongs under "unpaid".
    return allInvoices.filter((inv) =>
      statusFilter === "paid"
        ? invoicePayment(inv).state === "paid"
        : invoicePayment(inv).balance > 0,
    );
  }, [allInvoices, statusFilter]);

  // Real money owed and received, so a part-paid invoice is not counted whole
  // on either side.
  const summary = useMemo(() => {
    let unpaid = 0;
    let paid = 0;
    for (const inv of allInvoices) {
      const position = invoicePayment(inv);
      unpaid += position.balance;
      paid += position.paid;
    }
    return { unpaid, paid, total: unpaid + paid };
  }, [allInvoices]);

  const unpaidCount = allInvoices.filter(
    (i) => invoicePayment(i).balance > 0,
  ).length;
  const paidCount = allInvoices.filter(
    (i) => invoicePayment(i).paid > 0,
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">
          Invoices &amp; Receipts
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          View your school invoices and payment status.
        </p>
      </div>

      {/* Student selector */}
      {childrenList.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {childrenList.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                effectiveChildId === child.id
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {child.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {!selectedChild ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            No children are linked to your account yet.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                  Total Outstanding
                </p>
                <p className="text-2xl font-serif text-amber-700">
                  {formatCurrency(summary.unpaid)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {unpaidCount} invoice{unpaidCount !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                  Total Paid
                </p>
                <p className="text-2xl font-serif text-emerald-700">
                  {formatCurrency(summary.paid)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {paidCount} payment{paidCount !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                  Total Invoiced
                </p>
                <p className="text-2xl font-serif text-slate-900">
                  {formatCurrency(summary.total)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {allInvoices.length} invoice
                  {allInvoices.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {(["all", "unpaid", "paid"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  statusFilter === status
                    ? "bg-montessori-primary/10 text-montessori-primary border-montessori-primary/20"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Filter className="w-3.5 h-3.5 inline mr-1.5" />
                {status === "all"
                  ? "All"
                  : status === "unpaid"
                    ? "Outstanding"
                    : "Paid"}
              </button>
            ))}
          </div>

          {/* Invoices list */}
          {filteredInvoices.length === 0 ? (
            <Card className="border-dashed border-slate-200 shadow-none">
              <CardContent className="py-16 text-center text-sm text-slate-500">
                No {statusFilter !== "all" ? statusFilter : ""} invoices.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => {
                const position = invoicePayment(invoice);
                return (
                <Card
                  key={invoice.id}
                  className="border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900 truncate">
                              {invoice.description}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium shrink-0 ${
                                position.state === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : position.state === "part_paid"
                                    ? "bg-sky-50 text-sky-700 border-sky-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {INVOICE_STATE_LABEL[position.state].toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {invoice.invoice_no && (
                              <span className="font-mono">
                                {invoice.invoice_no} ·{" "}
                              </span>
                            )}
                            Issued:{" "}
                            {new Date(invoice.issued_at).toLocaleDateString(
                              "en-NG",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                            {position.balance > 0 &&
                              (position.balanceDueDate ?? invoice.due_date) &&
                              ` · Due: ${new Date((position.balanceDueDate ?? invoice.due_date) as string).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`}
                          </p>
                          {(invoice.period_start || invoice.period_end) && (
                            <p className="text-xs text-slate-600 mt-1">
                              Coverage:{" "}
                              <span className="font-medium text-slate-700">
                                {invoice.period_start && invoice.period_end
                                  ? `${formatDate(invoice.period_start)} – ${formatDate(invoice.period_end)}`
                                  : formatDate(
                                      (invoice.period_start ?? invoice.period_end)!,
                                    )}
                              </span>
                              {invoice.discount_cents > 0 && (
                                <span className="ml-2 text-emerald-600 font-medium">
                                  ({formatCurrency(invoice.discount_cents)} discount)
                                </span>
                              )}
                            </p>
                          )}
                          {invoice.discount_cents > 0 &&
                            !invoice.period_start &&
                            !invoice.period_end && (
                              <p className="text-xs text-emerald-600 mt-1 font-medium">
                                {formatCurrency(invoice.discount_cents)} discount applied
                              </p>
                            )}
                          {position.state === "part_paid" && (
                            <p className="text-xs text-slate-600 mt-1">
                              {formatCurrency(position.paid)} paid ·{" "}
                              <span className="font-medium text-amber-700">
                                {formatCurrency(position.balance)} balance
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-lg font-serif text-slate-900">
                          {formatCurrency(position.total)}
                        </p>
                        <Link
                          href={`/invoice/${invoice.id}`}
                          className="text-xs font-medium text-montessori-primary hover:underline"
                        >
                          View {position.paid > 0 ? "receipt" : "invoice"}
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
