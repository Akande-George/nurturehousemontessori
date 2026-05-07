"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createInvoice,
  formatCurrency,
  getStudentById,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { useToast } from "@/hooks/use-toast";

export default function AccountingPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [amount, setAmount] = useState("1400");
  const [description, setDescription] = useState("November Tuition");
  const [dueDate, setDueDate] = useState("2026-05-12");
  const { toast } = useToast();

  const store = useDemoStore();
  const zoe = getStudentById("zoe");

  const totals = useMemo(() => {
    const paid = store.invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.amountCents, 0);
    const unpaid = store.invoices
      .filter((invoice) => invoice.status === "unpaid")
      .reduce((sum, invoice) => sum + invoice.amountCents, 0);

    return {
      paid,
      unpaid,
      count: store.invoices.length,
    };
  }, [store]);

  const handleCreateInvoice = () => {
    const parsedAmount = Number(amount);

    if (
      !zoe ||
      Number.isNaN(parsedAmount) ||
      parsedAmount <= 0 ||
      !description.trim() ||
      !dueDate
    ) {
      toast({
        title: "Invalid invoice",
        description:
          "Please provide a valid amount, description, and due date.",
      });
      return;
    }

    createInvoice({
      studentId: zoe.id,
      description: description.trim(),
      amountCents: Math.round(parsedAmount * 100),
      dueDate,
    });

    setIsCreateOpen(false);
    toast({
      title: "Invoice issued",
      description:
        "Amanda can now see this invoice in the parent portal and public invoice route.",
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Issue invoices from admin and verify they surface in parent and
            invoice flows.
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
          {store.invoices.map((invoice) => {
            const student = getStudentById(invoice.studentId);
            return (
              <div
                key={invoice.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{invoice.id}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {student?.name ?? "Unknown Student"} • {invoice.description}
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
                    {formatCurrency(invoice.amountCents)}
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/invoice/${invoice.id}`}>Open</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create invoice for Zoe Wong</DialogTitle>
            <DialogDescription>
              This demo keeps the cross-role narrative anchored to one student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Description</p>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Amount (USD)</p>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Due date</p>
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
