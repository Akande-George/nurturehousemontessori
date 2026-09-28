"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  createInvoice,
  deleteInvoice,
  markInvoicePaid,
  updateInvoice,
} from "@/lib/actions/operations";
import { invoiceLineItems, type Invoice } from "@/lib/db/types";

type StudentOption = { id: string; name: string };

function formatCurrency(cents: number) {
  return `₦${(cents / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  })}`;
}

export function AccountingClient({
  invoices,
  students,
}: {
  invoices: Invoice[];
  students: StudentOption[];
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [items, setItems] = useState<{ description: string; amount: string }[]>(
    [{ description: "Tuition", amount: "" }],
  );
  const [tax, setTax] = useState("");
  const [dueDate, setDueDate] = useState("");
  // Unpaid invoice being edited; null while the dialog issues a new one.
  const [editing, setEditing] = useState<Invoice | null>(null);

  const resetForm = () => {
    setEditing(null);
    setItems([{ description: "Tuition", amount: "" }]);
    setTax("");
    setDueDate("");
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (invoice: Invoice) => {
    setEditing(invoice);
    setStudentId(invoice.student_id);
    setItems(
      invoiceLineItems(invoice).map((item) => ({
        description: item.description,
        amount: String(item.amount_cents / 100),
      })),
    );
    setTax(invoice.tax_cents > 0 ? String(invoice.tax_cents / 100) : "");
    setDueDate(invoice.due_date ?? "");
    setIsCreateOpen(true);
  };

  const updateItem = (
    index: number,
    patch: Partial<{ description: string; amount: string }>,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const subtotal = items.reduce((sum, item) => {
    const value = Number(item.amount);
    return sum + (Number.isNaN(value) || value <= 0 ? 0 : value);
  }, 0);
  const taxAmount = Number(tax) > 0 ? Number(tax) : 0;
  const grandTotal = subtotal + taxAmount;

  const studentName = (id: string) =>
    students.find((s) => s.id === id)?.name ?? "Unknown Student";

  const totals = useMemo(() => {
    const paid = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.amount_cents, 0);
    const unpaid = invoices
      .filter((invoice) => invoice.status === "unpaid")
      .reduce((sum, invoice) => sum + invoice.amount_cents, 0);
    return { paid, unpaid, count: invoices.length };
  }, [invoices]);

  const handleCreateInvoice = () => {
    const validItems = items
      .map((item) => ({
        description: item.description.trim(),
        amountCents: Math.round(Number(item.amount) * 100),
      }))
      .filter(
        (item) =>
          item.description &&
          !Number.isNaN(item.amountCents) &&
          item.amountCents > 0,
      );
    if (!studentId || validItems.length === 0 || !dueDate) {
      toast({
        title: "Invalid invoice",
        description:
          "Please provide a student, a due date, and at least one item with a description and amount.",
        variant: "destructive",
      });
      return;
    }
    const editingId = editing?.id ?? null;
    start(async () => {
      // Editing recomputes totals server-side and keeps the invoice number; no
      // email is re-sent.
      const res = editingId
        ? await updateInvoice(editingId, {
            items: validItems,
            taxCents: Math.round(taxAmount * 100),
            dueDate,
          })
        : await createInvoice({
            studentId,
            items: validItems,
            taxCents: Math.round(taxAmount * 100),
            dueDate,
          });
      if (res.ok) {
        setIsCreateOpen(false);
        resetForm();
        toast({ title: editingId ? "Invoice updated" : "Invoice issued" });
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  const handleDelete = (invoice: Invoice) => {
    const label = invoice.invoice_no ?? invoice.description;
    if (
      !window.confirm(
        `Delete invoice ${label} for ${studentName(invoice.student_id)}? This can't be undone.`,
      )
    )
      return;
    start(async () => {
      const res = await deleteInvoice(invoice.id);
      if (res.ok) toast({ title: "Invoice deleted" });
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  const handleMarkPaid = (invoiceId: string) => {
    start(async () => {
      const res = await markInvoicePaid(invoiceId);
      if (res.ok) toast({ title: "Invoice marked paid" });
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Issue invoices and track which families have paid.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
        >
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Paid
            </p>
            <p className="text-2xl font-serif text-emerald-700 mt-2">
              {formatCurrency(totals.paid)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Outstanding
            </p>
            <p className="text-2xl font-serif text-amber-700 mt-2">
              {formatCurrency(totals.unpaid)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Invoices issued
            </p>
            <p className="text-2xl font-serif text-slate-900 mt-2">
              {totals.count}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Invoice ledger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoices.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No invoices issued yet.
            </p>
          ) : (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {studentName(invoice.student_id)}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {invoice.invoice_no && (
                      <span className="font-mono text-xs text-slate-400 mr-2">
                        {invoice.invoice_no}
                      </span>
                    )}
                    {invoice.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
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
                  <p className="font-medium text-slate-900">
                    {formatCurrency(invoice.amount_cents)}
                  </p>
                  {invoice.status !== "paid" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleMarkPaid(invoice.id)}
                      >
                        Mark paid
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => openEdit(invoice)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleDelete(invoice)}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/invoice/${invoice.id}`}>Open</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? `Edit invoice${editing.invoice_no ? ` ${editing.invoice_no}` : ""}`
                : "Create invoice"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the items, tax, or due date. The family is not emailed again."
                : "Issue an invoice to a student's family."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Student</Label>
              <Select
                value={studentId}
                onValueChange={setStudentId}
                disabled={!!editing}
              >
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Items</Label>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Description (e.g. Tuition)"
                      value={item.description}
                      onChange={(event) =>
                        updateItem(index, { description: event.target.value })
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount (₦)"
                      value={item.amount}
                      onChange={(event) =>
                        updateItem(index, { amount: event.target.value })
                      }
                      className="w-36"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2 text-slate-400 hover:text-red-600"
                      disabled={items.length === 1}
                      onClick={() =>
                        setItems((prev) => prev.filter((_, i) => i !== index))
                      }
                      aria-label="Remove item"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems((prev) => [...prev, { description: "", amount: "" }])
                }
              >
                + Add item
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tax (₦, optional)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={tax}
                  onChange={(event) => setTax(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(Math.round(subtotal * 100))}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>{formatCurrency(Math.round(taxAmount * 100))}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(Math.round(grandTotal * 100))}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={pending}
              className="bg-montessori-primary text-white"
            >
              {editing ? "Save Changes" : "Issue Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
