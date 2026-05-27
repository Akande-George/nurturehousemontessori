"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Eye, FileText, Filter } from "lucide-react";
import {
  formatCurrency,
  getRoleUser,
  getStudentInvoices,
  getStudentsForParent,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { downloadStructuredPdf } from "@/lib/pdf/download-pdf";

export default function InvoicesPage() {
  useDemoStore();
  const parent = getRoleUser("parent");
  const children = getStudentsForParent(parent.id);

  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    children.length > 0 ? children[0].id : null,
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "paid">(
    "all",
  );

  const selectedChild = selectedChildId
    ? children.find((c) => c.id === selectedChildId)
    : null;
  const allInvoices = selectedChild ? getStudentInvoices(selectedChild.id) : [];

  const filteredInvoices = useMemo(() => {
    if (statusFilter === "all") return allInvoices;
    return allInvoices.filter((inv) => inv.status === statusFilter);
  }, [allInvoices, statusFilter]);

  const summary = useMemo(() => {
    const unpaid = allInvoices
      .filter((inv) => inv.status === "unpaid")
      .reduce((sum, inv) => sum + inv.amountCents, 0);
    const paid = allInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amountCents, 0);
    return { unpaid, paid, total: unpaid + paid };
  }, [allInvoices]);

  const handleDownloadReceipt = async (
    invoiceId: string,
    _description: string,
  ) => {
    const invoice = allInvoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;
    const issued = new Date(invoice.issuedAt).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const due = new Date(invoice.dueDate).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    await downloadStructuredPdf({
      filename: `${invoice.id}.pdf`,
      header: "Nurture House Montessori · Ilorin, Nigeria",
      footer: "Thank you for your payment. Queries: admin@nurturehouse.edu",
      lines: [
        { kind: "title", text: "Receipt / Invoice" },
        { kind: "subtitle", text: invoice.id },
        { kind: "spacer", size: 6 },
        { kind: "rule" },
        { kind: "label-value", label: "Date Issued", value: issued },
        { kind: "label-value", label: "Student", value: selectedChild?.name ?? "" },
        {
          kind: "label-value",
          label: "Classroom",
          value: selectedChild?.classroom ?? "",
        },
        { kind: "rule" },
        { kind: "heading", text: "Items" },
        {
          kind: "table",
          headers: ["Description", "Amount"],
          rows: [
            [invoice.description, formatCurrency(invoice.amountCents)],
          ],
        },
        { kind: "rule" },
        {
          kind: "label-value",
          label: "TOTAL DUE",
          value: formatCurrency(invoice.amountCents),
        },
        {
          kind: "label-value",
          label: "Status",
          value: invoice.status.toUpperCase(),
        },
        ...(invoice.status === "unpaid"
          ? ([{ kind: "label-value", label: "Due Date", value: due }] as const)
          : []),
      ],
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">
          Invoices & Receipts
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          View and download your school invoices and payment receipts.
        </p>
      </div>

      {/* Student selector */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                selectedChildId === child.id
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full ${child.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}
              >
                {child.name[0]}
              </div>
              {child.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {selectedChild && (
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
                  {allInvoices.filter((i) => i.status === "unpaid").length}{" "}
                  invoice
                  {allInvoices.filter((i) => i.status === "unpaid").length !== 1
                    ? "s"
                    : ""}
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
                  {allInvoices.filter((i) => i.status === "paid").length}{" "}
                  payment
                  {allInvoices.filter((i) => i.status === "paid").length !== 1
                    ? "s"
                    : ""}
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
              {filteredInvoices.map((invoice) => (
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
                            <p className="font-semibold text-slate-900">
                              {invoice.id}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium shrink-0 ${
                                invoice.status === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {invoice.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700">
                            {invoice.description}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Issued:{" "}
                            {new Date(invoice.issuedAt).toLocaleDateString(
                              "en-NG",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                            {invoice.status === "unpaid" &&
                              ` · Due: ${new Date(invoice.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-lg font-serif text-slate-900">
                          {formatCurrency(invoice.amountCents)}
                        </p>
                        <button
                          onClick={() =>
                            handleDownloadReceipt(
                              invoice.id,
                              invoice.description,
                            )
                          }
                          className="px-3 py-1.5 text-xs font-medium text-montessori-primary border border-montessori-primary/30 rounded-lg hover:bg-montessori-primary/5 transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
