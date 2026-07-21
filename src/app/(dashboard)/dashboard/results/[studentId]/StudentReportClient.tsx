"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { setReportCardRemarks } from "@/lib/actions/academics";
import type {
  PromotionStatus,
  Term,
} from "@/lib/db/types";
import type { ReportCardWithRows } from "@/lib/db/reportCards";

const TERM_LABEL: Record<Term, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

const PROMOTION_LABEL: Record<PromotionStatus, string> = {
  promoted: "Promoted",
  repeated: "Repeated",
  pending: "Pending",
};

export function StudentReportClient({
  studentName,
  cards,
  classNames,
  subjectNames,
}: {
  studentName: string;
  cards: ReportCardWithRows[];
  classNames: Record<string, string>;
  subjectNames: Record<string, string>;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id ?? "");
  const card = cards.find((c) => c.id === selectedCardId) ?? cards[0];

  const [teacherRemark, setTeacherRemark] = useState("");
  const [principalRemark, setPrincipalRemark] = useState("");
  const [promotionStatus, setPromotionStatus] =
    useState<PromotionStatus>("pending");

  useEffect(() => {
    if (card) {
      setTeacherRemark(card.teacher_remark ?? "");
      setPrincipalRemark(card.principal_remark ?? "");
      setPromotionStatus(card.promotion_status);
    }
  }, [card?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const clsName = classNames[card.class_id] ?? "School";

  const handleSave = () => {
    start(async () => {
      const res = await setReportCardRemarks(card.id, {
        teacher_remark: teacherRemark,
        principal_remark: principalRemark,
        promotion_status: promotionStatus,
      });
      if (res.ok) toast({ title: "Remarks saved" });
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 print:hidden">
        <Link
          href="/dashboard/results"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </Link>
        <div className="flex items-center gap-3">
          {cards.length > 1 && (
            <Select value={card.id} onValueChange={setSelectedCardId}>
              <SelectTrigger className="bg-white border-slate-200 w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {TERM_LABEL[c.term]} · {c.academic_year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DownloadPdfButton targetId="report-card" filename="report-card.pdf" />
          <Button
            onClick={() => window.print()}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
          >
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <Card id="report-card" className="border-slate-100 shadow-sm">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-6 mb-6">
            <h2 className="text-xl font-serif text-slate-900">
              {clsName} Report Card
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {TERM_LABEL[card.term]} · {card.academic_year}
            </p>
          </div>

          {/* Student summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Student
              </p>
              <p className="text-sm font-medium text-slate-900">
                {studentName}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Class
              </p>
              <p className="text-sm font-medium text-slate-900">{clsName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Average
              </p>
              <p className="text-sm font-medium text-slate-900">
                {Number(card.average).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Position
              </p>
              <p className="text-sm font-medium text-slate-900">
                {card.overall_position} of {card.class_size}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge
              variant="secondary"
              className="bg-montessori-primary/10 text-montessori-primary border-none px-3 py-1"
            >
              Overall Grade: {card.overall_grade}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-600 border-none px-3 py-1"
            >
              Total: {Number(card.total_score)}
            </Badge>
            <Badge
              variant="secondary"
              className={
                card.promotion_status === "promoted"
                  ? "bg-emerald-100 text-emerald-700 border-none px-3 py-1"
                  : card.promotion_status === "repeated"
                    ? "bg-amber-100 text-amber-700 border-none px-3 py-1"
                    : "bg-slate-100 text-slate-500 border-none px-3 py-1"
              }
            >
              {PROMOTION_LABEL[card.promotion_status]}
            </Badge>
          </div>

          {/* Subject rows */}
          <div className="rounded-lg border border-slate-100 overflow-hidden mb-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">CA (40)</TableHead>
                  <TableHead className="text-center">Exam (60)</TableHead>
                  <TableHead className="text-center">Total (100)</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead className="text-center">Pos.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {card.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-slate-900">
                      {subjectNames[row.subject_id] ?? row.subject_id}
                    </TableCell>
                    <TableCell className="text-center text-slate-700">
                      {Number(row.ca_total)}
                    </TableCell>
                    <TableCell className="text-center text-slate-700">
                      {Number(row.exam_score)}
                    </TableCell>
                    <TableCell className="text-center font-medium text-slate-900">
                      {Number(row.total)}
                    </TableCell>
                    <TableCell className="text-center text-slate-700">
                      {row.grade}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {row.remark}
                    </TableCell>
                    <TableCell className="text-center text-slate-700">
                      {row.subject_position ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Remarks (editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Class Teacher&apos;s Remark</Label>
              <Textarea
                value={teacherRemark}
                onChange={(e) => setTeacherRemark(e.target.value)}
                placeholder="e.g. A diligent and focused pupil."
                className="min-h-24"
              />
            </div>
            <div className="space-y-2">
              <Label>Principal&apos;s Remark</Label>
              <Textarea
                value={principalRemark}
                onChange={(e) => setPrincipalRemark(e.target.value)}
                placeholder="e.g. Keep up the good work."
                className="min-h-24"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 print:hidden">
            <div className="space-y-2">
              <Label>Promotion Status</Label>
              <Select
                value={promotionStatus}
                onValueChange={(value) =>
                  setPromotionStatus(value as PromotionStatus)
                }
              >
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="promoted">Promoted</SelectItem>
                  <SelectItem value="repeated">Repeated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSave}
                disabled={pending}
                className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
              >
                <Save className="w-4 h-4" /> Save Remarks
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
