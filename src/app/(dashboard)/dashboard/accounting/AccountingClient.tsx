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
import { createInvoice, markInvoicePaid } from "@/lib/actions/operations";
import type { Invoice } from "@/lib/db/types";

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
  const [amount, setAmount] = useState("1400");
  const [description, setDescription] = useState("Tuition");
  const [dueDate, setDueDate] = useState("");

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
    const parsedAmount = Number(amount);
    if (
      !studentId ||
      Number.isNaN(parsedAmount) ||
      parsedAmount <= 0 ||
      !description.trim() ||
      !dueDate
    ) {
      toast({
        title: "Invalid invoice",
        description:
          "Please provide a valid student, amount, description, and due date.",
        variant: "destructive",
      });
      return;
    }
    start(async () => {
      const res = await createInvoice({
        studentId,
        description: description.trim(),
        amountCents: Math.round(parsedAmount * 100),
        dueDate,
      });
      if (res.ok) {
        setIsCreateOpen(false);
        toast({ title: "Invoice issued" });
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
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
          onClick={() => setIsCreateOpen(true)}
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
                    {invoice.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
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
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleMarkPaid(invoice.id)}
                    >
                      Mark paid
                    </Button>
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create invoice</DialogTitle>
            <DialogDescription>
              Issue an invoice to a student&apos;s family.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
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
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={pending}
              className="bg-montessori-primary text-white"
            >
              Issue Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
