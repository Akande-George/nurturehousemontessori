"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { updateDailyReportStatus } from "@/lib/actions/montessori";
import type { DailyReport } from "@/lib/db/montessori";
import type { Enums } from "@/lib/db/types";

type AgeGroup = Enums["age_group"];
type ReportStatus = Enums["daily_report_status"];

const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  infant_0_2: "Infant Community",
  primary_3_6: "Children's House",
  lower_7_9: "7–9 Years",
};

const statusTone: Record<ReportStatus, string> = {
  draft: "bg-amber-100 text-amber-700",
  sent: "bg-sky-100 text-sky-700",
};

export function ReportsClient({
  reports,
  studentNames,
  studentClassrooms,
}: {
  reports: DailyReport[];
  studentNames: Record<string, string>;
  studentClassrooms: Record<string, string>;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<ReportStatus>("draft");

  const counts = useMemo(() => {
    let draft = 0;
    let sent = 0;
    for (const r of reports) {
      if (r.status === "sent") sent += 1;
      else draft += 1;
    }
    return { draft, sent };
  }, [reports]);

  const visible = reports.filter((r) => r.status === tab);

  const setStatus = (report: DailyReport, status: ReportStatus) => {
    start(async () => {
      const res = await updateDailyReportStatus(report.id, status);
      if (res.ok) {
        toast({
          title: status === "sent" ? "Report sent" : "Report moved to draft",
          description: `${studentNames[report.student_id] ?? "Student"}'s daily report updated.`,
        });
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-serif text-slate-900 mb-1">Daily Reports</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Prepare and send daily feedback forms to families.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-3xl font-serif text-slate-900">{counts.draft}</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
              Draft
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-3xl font-serif text-sky-700">{counts.sent}</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
              Sent
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4 text-sm font-medium">
          {(
            [
              ["draft", counts.draft],
              ["sent", counts.sent],
            ] as Array<[ReportStatus, number]>
          ).map(([t, count]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-1 border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-montessori-primary text-montessori-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t} ({count})
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                  Child
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                  Programme
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                  Date
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">
                  Status
                </TableHead>
                <TableHead className="font-medium text-right text-xs uppercase tracking-wider text-slate-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium text-slate-900">
                    {studentNames[report.student_id] ?? "Unknown child"}
                    {studentClassrooms[report.student_id] && (
                      <p className="text-xs text-slate-500 font-normal">
                        {studentClassrooms[report.student_id]}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {AGE_GROUP_LABELS[report.age_group]}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {report.report_date}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${statusTone[report.status]} font-medium border-none capitalize`}
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {report.status === "draft" ? (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => setStatus(report, "sent")}
                        className="h-8 text-xs bg-montessori-primary text-white hover:bg-montessori-primary/90"
                      >
                        Send
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => setStatus(report, "draft")}
                        className="h-8 text-xs bg-white"
                      >
                        Move to draft
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-sm text-slate-500"
                  >
                    No {tab} reports right now.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
