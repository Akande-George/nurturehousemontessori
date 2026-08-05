"use client";

import { useMemo, useState } from "react";
import { Star, Sparkles, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHARACTER_TRAITS, RATING_LABELS } from "@/lib/montessori/character";
import { summarizeByArea, type ObsLite } from "@/lib/montessori/term-summary";
import type { Progress } from "@/lib/db/montessori";

type ChildLite = { id: string; name: string; avatar_color: string };

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

export function ParentTermlyClient({
  children,
  reportByStudent,
  obsByStudent,
}: {
  children: ChildLite[];
  reportByStudent: Record<string, Progress | null>;
  obsByStudent: Record<string, ObsLite[]>;
}) {
  const [selectedId, setSelectedId] = useState(children[0]?.id ?? "");
  const child = children.find((c) => c.id === selectedId);
  const report = reportByStudent[selectedId] ?? null;
  const rollup = useMemo(
    () => summarizeByArea(obsByStudent[selectedId] ?? []),
    [obsByStudent, selectedId],
  );
  const ratings = (report?.character_ratings as Record<string, number>) ?? {};
  const ratedTraits = CHARACTER_TRAITS.filter((t) => ratings[t]);

  if (children.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-slate-500">
        No children linked to your account yet.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Termly Report</h1>
          <p className="text-sm text-slate-500">Your child&apos;s end-of-term summary and character profile.</p>
        </div>
        {children.length > 1 && (
          <div className="w-full sm:max-w-[220px]">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {children.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!report ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500">
              {child?.name?.split(" ")[0] ?? "Your child"}&apos;s termly report hasn&apos;t been
              published yet. Please check back at the end of term.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full ${child?.avatar_color ?? "bg-slate-200"} text-white flex items-center justify-center font-bold`}>
                  {child?.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <CardTitle className="text-lg">{child?.name}</CardTitle>
                  <p className="text-sm text-slate-500">
                    {[report.term, report.academic_year].filter(Boolean).join(" · ") || "This term"}
                    {report.teacher_name ? ` · ${report.teacher_name}` : ""}
                  </p>
                </div>
              </div>
            </CardHeader>
            {report.teacher_comments && (
              <CardContent>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {report.teacher_comments}
                </p>
              </CardContent>
            )}
          </Card>

          {(report.strengths.length > 0 || report.areas_for_growth.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {report.strengths.length > 0 && (
                <Card className="border-slate-100 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Strengths</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {report.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-slate-700 flex gap-2">
                          <span className="text-emerald-500">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {report.areas_for_growth.length > 0 && (
                <Card className="border-slate-100 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Areas for growth</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {report.areas_for_growth.map((s, i) => (
                        <li key={i} className="text-sm text-slate-700 flex gap-2">
                          <span className="text-amber-500">→</span> {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {ratedTraits.length > 0 && (
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-base">Character profile</CardTitle></CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-100">
                  {ratedTraits.map((trait) => (
                    <div key={trait} className="flex items-center justify-between py-3 gap-4">
                      <span className="text-sm font-medium text-slate-800">{trait}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          {RATING_LABELS[ratings[trait]]}
                        </span>
                        <Stars value={ratings[trait]} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-100 shadow-sm bg-montessori-sky/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-montessori-primary" /> What they explored this term
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rollup.length === 0 ? (
                <p className="text-sm text-slate-500">No recorded activities yet this term.</p>
              ) : (
                <div className="space-y-2">
                  {rollup.map((r) => (
                    <div key={r.area} className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="secondary" className="bg-white text-slate-700 border border-slate-200">
                        {r.area} · {r.count}
                      </Badge>
                      {r.activities.length > 0 && (
                        <span className="text-slate-500">{r.activities.join(", ")}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
