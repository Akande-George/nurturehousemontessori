"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TERM_LABELS, formatReportDate } from "@/lib/montessori/conference";
import type { Term } from "@/lib/db/types";

type ChildLite = { id: string; name: string; avatar_color: string };

type ReportLite = {
  id: string;
  studentId: string;
  title: string;
  term: Term;
  academicYear: string;
  periodStart: string;
  periodEnd: string;
  publishedAt: string | null;
};

export function ProgressReportsClient({
  childrenList,
  reports,
}: {
  childrenList: ChildLite[];
  reports: ReportLite[];
}) {
  const [selectedId, setSelectedId] = useState(childrenList[0]?.id ?? "");
  const child = childrenList.find((c) => c.id === selectedId);
  const visible = reports.filter((r) => r.studentId === selectedId);

  if (childrenList.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-slate-500">
        No children linked to your account yet.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="font-serif text-2xl text-slate-900">Progress Reports</h1>
        <p className="text-sm text-slate-500">
          Your child&apos;s termly report — attendance, the lessons they worked
          on, observations, photographs and their guide&apos;s summary.
        </p>
      </div>

      {childrenList.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {childrenList.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                c.id === selectedId
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${c.avatar_color}`}
              >
                {c.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <FileText className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-500">
            {child?.name.split(" ")[0] ?? "Your child"}&apos;s progress report
            hasn&apos;t been published yet. Please check back at the end of term.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => (
            <li key={r.id}>
              <Link
                href={`/parent/progress-reports/${r.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-montessori-primary/30"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{r.title}</p>
                  <p className="text-sm text-slate-500">
                    {TERM_LABELS[r.term]} · {r.academicYear}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatReportDate(r.periodStart)} –{" "}
                    {formatReportDate(r.periodEnd)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge
                    variant="outline"
                    className="hidden border-emerald-200 bg-emerald-50 text-emerald-700 sm:inline-flex"
                  >
                    Published
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
