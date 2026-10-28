"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Building2, Check, ChevronDown, Search, X } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import {
  createInvoice,
  deleteInvoice,
  recordPayment,
  updateInvoice,
} from "@/lib/actions/operations";
import { updateSchoolBankDetails } from "@/lib/actions/schools";
import {
  invoiceLineItems,
  invoicePayment,
  INVOICE_STATE_LABEL,
  type Invoice,
} from "@/lib/db/types";

type StudentOption = { id: string; name: string };

type SchoolBankDetails = {
  id: string;
  name: string;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
};

function formatCurrency(cents: number) {
  return `₦${(cents / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB");
  }
  return new Date(iso).toLocaleDateString("en-GB");
}

export function AccountingClient({
  invoices,
  students,
  school,
}: {
  invoices: Invoice[];
  students: StudentOption[];
  school?: SchoolBankDetails;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  // School-level bank details modal
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [schoolBankName, setSchoolBankName] = useState(school?.bank_name ?? "");
  const [schoolAccountName, setSchoolAccountName] = useState(
    school?.bank_account_name ?? school?.name ?? "",
  );
  const [schoolAccountNumber, setSchoolAccountNumber] = useState(
    school?.bank_account_number ?? "",
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [studentSearch, setStudentSearch] = useState("");
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const studentPickerRef = useRef<HTMLDivElement>(null);
  const [ledgerSearch, setLedgerSearch] = useState("");

  const [items, setItems] = useState<{ description: string; amount: string }[]>(
    [{ description: "Tuition", amount: "" }],
  );
  const [tax, setTax] = useState("");
  const [discount, setDiscount] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Invoice-specific bank details
  const [invBankName, setInvBankName] = useState(school?.bank_name ?? "");
  const [invAccountName, setInvAccountName] = useState(
    school?.bank_account_name ?? school?.name ?? "",
  );
  const [invAccountNumber, setInvAccountNumber] = useState(
    school?.bank_account_number ?? "",
  );
  const [showCustomBank, setShowCustomBank] = useState(false);

  // Unpaid invoice being edited; null while the dialog issues a new one.
  const [editing, setEditing] = useState<Invoice | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        studentPickerRef.current &&
        !studentPickerRef.current.contains(event.target as Node)
      ) {
        setIsStudentPickerOpen(false);
      }
    }
    if (isStudentPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isStudentPickerOpen]);

  // Invoice having a payment recorded against it; null when the dialog is shut.
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payBalanceDue, setPayBalanceDue] = useState("");
  const [payNote, setPayNote] = useState("");

  const payingPosition = paying ? invoicePayment(paying) : null;
  const payEntered = Number(payAmount);
  const payCents =
    Number.isFinite(payEntered) && payEntered > 0
      ? Math.round(payEntered * 100)
      : 0;
  // Only ask for a deadline when this payment leaves something owing.
  const leavesBalance =
    !!payingPosition && payCents > 0 && payCents < payingPosition.balance;

  const openPayment = (invoice: Invoice) => {
    const position = invoicePayment(invoice);
    setPaying(invoice);
    // Default to settling the invoice; the office edits down for a part-payment.
    setPayAmount(String(position.balance / 100));
    setPayBalanceDue(invoice.balance_due_date ?? "");
    setPayNote(invoice.payment_note ?? "");
  };

  const closePayment = () => {
    setPaying(null);
    setPayAmount("");
    setPayBalanceDue("");
    setPayNote("");
  };

  const handleRecordPayment = () => {
    if (!paying || !payingPosition) return;
    if (payCents <= 0) {
      toast({
        title: "Enter an amount",
        description: "The amount received must be greater than zero.",
        variant: "destructive",
      });
      return;
    }
    if (leavesBalance && !payBalanceDue) {
      toast({
        title: "Balance due date required",
        description:
          "This leaves a balance outstanding — set the date it falls due.",
        variant: "destructive",
      });
      return;
    }
    const invoiceId = paying.id;
    start(async () => {
      const res = await recordPayment({
        invoiceId,
        amountCents: payCents,
        balanceDueDate: leavesBalance ? payBalanceDue : null,
        note: payNote,
      });
      if (res.ok) {
        closePayment();
        toast({
          title: "Payment recorded",
          description:
            payCents >= payingPosition.balance
              ? "The invoice is now fully paid."
              : `${formatCurrency(
                  payingPosition.balance - payCents,
                )} still outstanding.`,
        });
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  const handleSaveSchoolBank = () => {
    if (!school?.id) return;
    start(async () => {
      const res = await updateSchoolBankDetails(school.id, {
        bank_name: schoolBankName,
        bank_account_name: schoolAccountName,
        bank_account_number: schoolAccountNumber,
      });
      if (res.ok) {
        toast({
          title: "Bank details saved",
          description: "Default invoice payment details have been updated.",
        });
        setIsBankDialogOpen(false);
      } else {
        toast({ title: res.error ?? "Failed to save", variant: "destructive" });
      }
    });
  };

  const resetForm = () => {
    setEditing(null);
    setItems([{ description: "Tuition", amount: "" }]);
    setTax("");
    setDiscount("");
    setPeriodStart("");
    setPeriodEnd("");
    setDueDate("");
    setStudentSearch("");
    setIsStudentPickerOpen(false);
    setShowCustomBank(false);
    setInvBankName(schoolBankName);
    setInvAccountName(schoolAccountName || school?.name || "");
    setInvAccountNumber(schoolAccountNumber);
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
    setDiscount(
      invoice.discount_cents > 0 ? String(invoice.discount_cents / 100) : "",
    );
    setPeriodStart(invoice.period_start ?? "");
    setPeriodEnd(invoice.period_end ?? "");
    setDueDate(invoice.due_date ?? "");

    const hasCustomBank = !!(
      (invoice.bank_account_number &&
        invoice.bank_account_number !== schoolAccountNumber) ||
      (invoice.bank_name && invoice.bank_name !== schoolBankName) ||
      (invoice.bank_account_name &&
        invoice.bank_account_name !== schoolAccountName)
    );
    setShowCustomBank(hasCustomBank);
    setInvBankName(invoice.bank_name ?? schoolBankName);
    setInvAccountName(
      invoice.bank_account_name ?? schoolAccountName ?? school?.name ?? "",
    );
    setInvAccountNumber(invoice.bank_account_number ?? schoolAccountNumber);

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
  const discountAmount = Number(discount) > 0 ? Number(discount) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  const studentName = (id: string) =>
    students.find((s) => s.id === id)?.name ?? "Unknown Student";

  const filteredStudentOptions = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, studentSearch]);

  const filteredInvoices = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((invoice) => {
      const sName = (students.find((s) => s.id === invoice.student_id)?.name ?? "").toLowerCase();
      const invNo = (invoice.invoice_no ?? "").toLowerCase();
      const desc = invoice.description.toLowerCase();
      return sName.includes(q) || invNo.includes(q) || desc.includes(q);
    });
  }, [invoices, ledgerSearch, students]);

  // Sum the money actually received and actually outstanding. Counting whole
  // invoices by status would misreport every part-paid invoice.
  const totals = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    for (const invoice of invoices) {
      const position = invoicePayment(invoice);
      paid += position.paid;
      unpaid += position.balance;
    }
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
    if (periodStart && periodEnd && periodStart > periodEnd) {
      toast({
        title: "Invalid coverage dates",
        description: "The coverage start date cannot be after the end date.",
        variant: "destructive",
      });
      return;
    }
    const editingId = editing?.id ?? null;
    start(async () => {
      // Editing recomputes totals server-side and keeps the invoice number; no
      // email is re-sent.
      const bankPayload = {
        bankName: showCustomBank ? invBankName.trim() || null : schoolBankName.trim() || null,
        bankAccountName: showCustomBank
          ? invAccountName.trim() || null
          : schoolAccountName.trim() || null,
        bankAccountNumber: showCustomBank
          ? invAccountNumber.trim() || null
          : schoolAccountNumber.trim() || null,
      };
      const res = editingId
        ? await updateInvoice(editingId, {
            items: validItems,
            taxCents: Math.round(taxAmount * 100),
            discountCents: Math.round(discountAmount * 100),
            periodStart: periodStart || null,
            periodEnd: periodEnd || null,
            dueDate,
            ...bankPayload,
          })
        : await createInvoice({
            studentId,
            items: validItems,
            taxCents: Math.round(taxAmount * 100),
            discountCents: Math.round(discountAmount * 100),
            periodStart: periodStart || null,
            periodEnd: periodEnd || null,
            dueDate,
            ...bankPayload,
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Issue invoices and track which families have paid.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {school?.id && (
            <Button
              variant="outline"
              onClick={() => setIsBankDialogOpen(true)}
              className="gap-2 border-slate-200"
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              Bank Details
            </Button>
          )}
          <Button
            onClick={openCreate}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
          >
            Create Invoice
          </Button>
        </div>
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
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Invoice ledger</CardTitle>
          {invoices.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by student or invoice #..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
              {ledgerSearch && (
                <button
                  type="button"
                  onClick={() => setLedgerSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear invoice search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {invoices.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No invoices issued yet.
            </p>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No invoices match &quot;{ledgerSearch}&quot;.
            </p>
          ) : (
            filteredInvoices.map((invoice) => {
              const position = invoicePayment(invoice);
              return (
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
                  {(invoice.period_start || invoice.period_end) && (
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-medium text-slate-600">Period:</span>{" "}
                      {invoice.period_start && invoice.period_end
                        ? `${formatDate(invoice.period_start)} – ${formatDate(invoice.period_end)}`
                        : formatDate(invoice.period_start ?? invoice.period_end!)}
                    </p>
                  )}
                  {invoice.discount_cents > 0 && (
                    <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                      Discount: {formatCurrency(invoice.discount_cents)} applied
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      position.state === "paid"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : position.state === "part_paid"
                          ? "bg-sky-50 border-sky-200 text-sky-700"
                          : "bg-amber-50 border-amber-200 text-amber-700"
                    }
                  >
                    {INVOICE_STATE_LABEL[position.state]}
                  </Badge>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">
                      {formatCurrency(position.total)}
                    </p>
                    {position.state === "part_paid" && (
                      <p className="text-xs text-slate-500">
                        {formatCurrency(position.paid)} paid ·{" "}
                        <span className="text-amber-700">
                          {formatCurrency(position.balance)} due
                        </span>
                      </p>
                    )}
                  </div>
                  {position.state !== "paid" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => openPayment(invoice)}
                    >
                      Record payment
                    </Button>
                  )}
                  {/* Once money is recorded the invoice is the payment record,
                      so it can no longer be edited away or deleted. */}
                  {position.paid === 0 && (
                    <>
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
                    <Link href={`/invoice/${invoice.id}`}>
                      {position.paid > 0 ? "Receipt" : "Open"}
                    </Link>
                  </Button>
                </div>
              </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!paying}
        onOpenChange={(open) => {
          if (!open) closePayment();
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {paying && payingPosition
                ? `${studentName(paying.student_id)} — ${formatCurrency(
                    payingPosition.balance,
                  )} outstanding of ${formatCurrency(payingPosition.total)}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="pay-amount">Amount received (₦)</Label>
              <Input
                id="pay-amount"
                type="number"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={(event) => setPayAmount(event.target.value)}
                placeholder="0.00"
              />
              {leavesBalance && payingPosition && (
                <p className="text-xs text-amber-700">
                  Leaves {formatCurrency(payingPosition.balance - payCents)}{" "}
                  outstanding.
                </p>
              )}
            </div>
            {leavesBalance && (
              <div className="space-y-1">
                <Label htmlFor="pay-balance-due">Balance due by</Label>
                <Input
                  id="pay-balance-due"
                  type="date"
                  value={payBalanceDue}
                  onChange={(event) => setPayBalanceDue(event.target.value)}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="pay-note">Remarks (optional)</Label>
              <Input
                id="pay-note"
                value={payNote}
                onChange={(event) => setPayNote(event.target.value)}
                placeholder="e.g. Part payment, bank transfer"
              />
              <p className="text-xs text-slate-500">
                Printed on the receipt the family sees.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePayment} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={pending}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 shrink-0 pr-12">
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
          <div className="space-y-4 p-6 py-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-1 relative" ref={studentPickerRef}>
              <Label htmlFor="student-picker-trigger">Student</Label>
              <button
                id="student-picker-trigger"
                type="button"
                disabled={!!editing}
                onClick={() => {
                  if (!editing) {
                    setIsStudentPickerOpen((prev) => !prev);
                  }
                }}
                className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-slate-900"
                aria-haspopup="listbox"
                aria-expanded={isStudentPickerOpen}
              >
                <span className="truncate">
                  {students.find((s) => s.id === studentId)?.name ?? "Select student"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
              </button>

              {isStudentPickerOpen && !editing && (
                <div className="absolute left-0 top-full mt-1 w-full z-50 rounded-md border border-slate-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="Type to search student name..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && filteredStudentOptions.length > 0) {
                            e.preventDefault();
                            setStudentId(filteredStudentOptions[0].id);
                            setIsStudentPickerOpen(false);
                            setStudentSearch("");
                          } else if (e.key === "Escape") {
                            setIsStudentPickerOpen(false);
                          }
                        }}
                        className="h-8 pl-8 pr-7 text-xs bg-slate-50 focus-visible:ring-1"
                        autoFocus
                      />
                      {studentSearch && (
                        <button
                          type="button"
                          onClick={() => setStudentSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label="Clear student search"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
                    {filteredStudentOptions.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500">
                        No students found matching &quot;{studentSearch}&quot;
                      </div>
                    ) : (
                      filteredStudentOptions.map((s) => {
                        const isSelected = s.id === studentId;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setStudentId(s.id);
                              setIsStudentPickerOpen(false);
                              setStudentSearch("");
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md text-left transition-colors ${
                              isSelected
                                ? "bg-montessori-primary/10 text-montessori-primary font-medium"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span className="truncate">{s.name}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-montessori-primary shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
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
                <Label htmlFor="invoice-discount">Discount (₦, optional)</Label>
                <Input
                  id="invoice-discount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoice-tax">Tax (₦, optional)</Label>
                <Input
                  id="invoice-tax"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={tax}
                  onChange={(event) => setTax(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Coverage period (optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 block">From</span>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(event) => setPeriodStart(event.target.value)}
                    aria-label="Coverage start date"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 block">To</span>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(event) => setPeriodEnd(event.target.value)}
                    aria-label="Coverage end date"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="invoice-due-date">Due date</Label>
              <Input
                id="invoice-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            {/* Bank details on invoice */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-montessori-primary" />
                  Bank Account on Invoice
                </span>
                <button
                  type="button"
                  onClick={() => setShowCustomBank((prev) => !prev)}
                  className="text-xs text-montessori-primary hover:underline font-medium"
                >
                  {showCustomBank ? "Use school default" : "Customize account"}
                </button>
              </div>

              {!showCustomBank ? (
                <div className="text-xs text-slate-600">
                  <p className="font-medium text-slate-800">
                    {schoolAccountName.trim() || school?.name || "School default account"}
                  </p>
                  <p className="text-slate-500">
                    {[schoolAccountNumber, schoolBankName].filter(Boolean).join(" · ") ||
                      "No default bank details configured yet (use Bank Details button above)."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-slate-600 block">
                      Account Name
                    </span>
                    <Input
                      placeholder="e.g. Nurture House Montessori School"
                      value={invAccountName}
                      onChange={(e) => setInvAccountName(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-slate-600 block">
                        Account Number
                      </span>
                      <Input
                        placeholder="e.g. 1307478941"
                        value={invAccountNumber}
                        onChange={(e) => setInvAccountNumber(e.target.value)}
                        className="h-8 text-xs bg-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-slate-600 block">
                        Bank Name
                      </span>
                      <Input
                        placeholder="e.g. Providus Bank"
                        value={invBankName}
                        onChange={(e) => setInvBankName(e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 text-sm space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(Math.round(subtotal * 100))}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>
                    -{formatCurrency(Math.round(discountAmount * 100))}
                  </span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span>{formatCurrency(Math.round(taxAmount * 100))}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200/80 pt-1.5">
                <span>Total</span>
                <span>{formatCurrency(Math.round(grandTotal * 100))}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 sm:p-6 sm:py-4 border-t border-slate-100 shrink-0 bg-slate-50/70">
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

      {/* School Bank Details Dialog */}
      <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-montessori-primary" />
              Invoice Bank Details
            </DialogTitle>
            <DialogDescription>
              Set the bank account information displayed on invoices and receipts for parent payments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="school-account-name">Account Name</Label>
              <Input
                id="school-account-name"
                placeholder="e.g. Nurture House Montessori School LTD"
                value={schoolAccountName}
                onChange={(e) => setSchoolAccountName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="school-account-number">Account Number</Label>
                <Input
                  id="school-account-number"
                  placeholder="e.g. 1307478941"
                  value={schoolAccountNumber}
                  onChange={(e) => setSchoolAccountNumber(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="school-bank-name">Bank</Label>
                <Input
                  id="school-bank-name"
                  placeholder="e.g. Providus Bank"
                  value={schoolBankName}
                  onChange={(e) => setSchoolBankName(e.target.value)}
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-1 text-center">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Preview on invoice
              </p>
              <p className="text-xs text-slate-500">Please make all payments to</p>
              <p className="text-sm font-bold text-slate-900">
                {schoolAccountName.trim() || school?.name || "Account Name"}
              </p>
              <p className="text-base font-mono font-bold text-montessori-primary tracking-wider">
                {schoolAccountNumber.trim() || "0000000000"}
              </p>
              <p className="text-xs text-slate-600 font-medium">
                {schoolBankName.trim() || "Bank Name"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBankDialogOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSchoolBank}
              disabled={pending}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              Save Bank Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
