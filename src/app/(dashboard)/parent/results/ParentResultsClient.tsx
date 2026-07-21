"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, ChevronRight, GraduationCap } from "lucide-react";
import type { ReportCard, Student, Term } from "@/lib/db/types";

const TERM_LABELS: Record<Term, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

function promotionBadge(status: string) {
  if (status === "promoted") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "repeated") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export function ParentResultsClient({
  children,
  cardsByChild,
}: {
  children: Student[];
  cardsByChild: Record<string, ReportCard[]>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const effectiveId =
    selectedId && children.some((c) => c.id === selectedId)
      ? selectedId
      : children[0]?.id ?? null;
  const child = effectiveId ? children.find((c) => c.id === effectiveId) ?? null : null;
  const cards = child ? cardsByChild[child.id] ?? [] : [];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-slate-900 mb-1">Term Results</h1>
        <p className="text-sm text-slate-500">
          View and open your child&apos;s termly report cards.
        </p>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                effectiveId === c.id
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {!child ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            No children are linked to your account yet.
          </CardContent>
        </Card>
      ) : cards.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-800">No results yet</p>
            <p className="text-sm text-slate-500 mt-1">
              {child.name.split(" ")[0]}&apos;s report cards will appear here once
              published by the school.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <Link key={card.id} href={`/parent/results/${card.id}`}>
              <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-montessori-primary/10 text-montessori-primary flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">
                            {TERM_LABELS[card.term]}
                          </p>
                          <span className="text-xs text-slate-500">
                            {card.academic_year}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${promotionBadge(card.promotion_status)}`}
                          >
                            {card.promotion_status.charAt(0).toUpperCase() +
                              card.promotion_status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-sm text-slate-600 mt-2">
                          <span>
                            Average:{" "}
                            <span className="font-semibold text-slate-900">
                              {Number(card.average).toFixed(1)}%
                            </span>
                          </span>
                          <span>
                            Position:{" "}
                            <span className="font-semibold text-slate-900">
                              {card.overall_position} of {card.class_size}
                            </span>
                          </span>
                          <span>
                            Grade:{" "}
                            <span className="font-semibold text-slate-900">
                              {card.overall_grade}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
