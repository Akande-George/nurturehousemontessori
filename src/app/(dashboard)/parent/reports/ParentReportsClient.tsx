"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, FileText } from "lucide-react";
import type { Student } from "@/lib/db/types";
import type { DailyReport } from "@/lib/db/montessori";

type WorkEntry = { area?: string; activity?: string; level?: string };

function moodEmoji(mood: string | null) {
  switch (mood) {
    case "Happy":
      return "😊";
    case "Sad":
      return "😢";
    case "Neutral":
      return "😐";
    default:
      return "😊";
  }
}

export function ParentReportsClient({
  children,
  reportsByChild,
}: {
  children: Student[];
  reportsByChild: Record<string, DailyReport[]>;
}) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(children[0]?.id ?? null);
  const selectedChild = selectedChildId ? children.find((c) => c.id === selectedChildId) ?? null : null;
  const reports = selectedChild ? reportsByChild[selectedChild.id] ?? [] : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:space-y-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">Daily Reports</h1>
        <p className="text-sm text-slate-500 mt-1">View daily activity reports for each child.</p>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
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
              <div className={`w-5 h-5 rounded-full ${child.avatar_color} text-white flex items-center justify-center text-[10px] font-bold`}>
                {child.name[0]}
              </div>
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
      ) : reports.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            No daily reports available yet for {selectedChild.name}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const content = (report.content ?? {}) as Record<string, unknown>;
            const workCycle = Array.isArray(content.workCycle) ? (content.workCycle as WorkEntry[]) : [];
            const meals = typeof content.meals === "string" ? content.meals : null;
            const nap = typeof content.nap === "string" ? content.nap : null;
            return (
              <Card key={report.id} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <p className="font-semibold text-slate-900">
                            {new Date(report.report_date).toLocaleDateString("en-NG", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${
                            report.status === "sent"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                        <span className="text-2xl">{moodEmoji(report.general_mood)}</span>
                        {report.week_label && (
                          <span className="text-xs text-slate-400">{report.week_label}</span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        {(meals || nap) && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Care</p>
                            <ul className="text-xs space-y-0.5">
                              {meals && <li className="text-slate-700">Meals: <strong>{meals}</strong></li>}
                              {nap && <li className="text-slate-700">Nap: <strong>{nap}</strong></li>}
                            </ul>
                          </div>
                        )}
                        {workCycle.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Work Areas</p>
                            <ul className="text-xs space-y-0.5">
                              {workCycle.slice(0, 2).map((work, i) => (
                                <li key={i} className="text-slate-700">
                                  {work.area}: <strong>{work.activity}</strong>
                                  {work.level ? ` (${work.level})` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 shrink-0 sm:flex-row md:w-auto md:flex-col">
                      <Button asChild variant="outline" size="sm" className="w-full gap-2 bg-white border-slate-200 sm:flex-1 md:w-auto">
                        <Link href={`/parent/reports/${report.id}`}>
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Full</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
