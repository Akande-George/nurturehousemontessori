import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getReportCardById } from "@/lib/db/reportCards";
import { getStudentById } from "@/lib/db/students";
import { getClassById } from "@/lib/db/classes";
import { PrintButton } from "@/components/PrintButton";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import type { Term } from "@/lib/db/types";

const TERM_LABELS: Record<Term, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

const ORD = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
const ordinal = (n: number) => ORD[n] ?? `${n}th`;

export default async function ParentReportCardPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  await requireRole("parent");
  const { reportId } = await params;
  const supabase = await createClient();
  const card = await getReportCardById(supabase!, reportId);

  if (!card) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-slate-500">Report card not found.</p>
        <Link href="/parent/results" className="text-montessori-primary hover:underline text-sm">
          Back to results
        </Link>
      </div>
    );
  }

  const [student, cls, subjectsRes] = await Promise.all([
    getStudentById(supabase!, card.student_id),
    getClassById(supabase!, card.class_id),
    supabase!.from("subjects").select("id,name"),
  ]);
  const subjectName = (id: string) =>
    (subjectsRes.data ?? []).find((s) => s.id === id)?.name ?? "Subject";

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/parent/results">
            <ArrowLeft className="w-4 h-4" /> Back to Results
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <DownloadPdfButton targetId="report-card" filename="report-card.pdf" />
          <PrintButton />
        </div>
      </div>

      <div
        id="report-card"
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-10"
      >
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-montessori-primary font-medium mb-2">
            Student Report Card
          </p>
          <h1 className="text-3xl font-serif text-slate-900">{student?.name}</h1>
          <p className="text-slate-500 mt-1">
            {cls?.name} · {TERM_LABELS[card.term]} · {card.academic_year}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 mb-1">Average</p>
            <p className="text-2xl font-serif text-slate-900">
              {Number(card.average).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 mb-1">Position</p>
            <p className="text-2xl font-serif text-slate-900">
              {ordinal(card.overall_position ?? 0)}{" "}
              <span className="text-slate-400 text-base">of {card.class_size}</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 mb-1">
              Overall Grade
            </p>
            <p className="text-2xl font-serif text-slate-900">{card.overall_grade}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 mb-1">
              Promotion
            </p>
            <Badge
              variant="outline"
              className="capitalize border-amber-200 bg-amber-50 text-amber-700"
            >
              {card.promotion_status}
            </Badge>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>CA (40)</TableHead>
              <TableHead>Exam (60)</TableHead>
              <TableHead>Total /100</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead>Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {card.rows
              .slice()
              .sort((a, b) =>
                subjectName(a.subject_id).localeCompare(subjectName(b.subject_id)),
              )
              .map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-slate-900">
                    {subjectName(r.subject_id)}
                  </TableCell>
                  <TableCell>{Number(r.ca_total)}</TableCell>
                  <TableCell>{Number(r.exam_score)}</TableCell>
                  <TableCell className="font-semibold">{Number(r.total)}</TableCell>
                  <TableCell className="font-semibold">{r.grade}</TableCell>
                  <TableCell className="text-slate-500">{r.remark}</TableCell>
                  <TableCell>{ordinal(r.subject_position ?? 0)}</TableCell>
                </TableRow>
              ))}
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="font-semibold">{Number(card.total_score)}</TableCell>
              <TableCell colSpan={3} />
            </TableRow>
          </TableBody>
        </Table>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 mb-1">
              Class Teacher&apos;s Remark
            </p>
            <p className="text-sm text-slate-700">{card.teacher_remark || "—"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 mb-1">
              Principal&apos;s Remark
            </p>
            <p className="text-sm text-slate-700">{card.principal_remark || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
