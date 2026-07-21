"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Grid3x3, Search, Sparkles, Users } from "lucide-react";
import { CURRICULUM } from "@/lib/curriculum/curriculum";
import {
  getCurriculumStats,
  touchedPercent,
  type ProgressMap,
} from "@/lib/curriculum/progress-utils";
import { CurriculumMatrix, type MatrixStudent } from "./CurriculumMatrix";
import type { Student } from "@/lib/db/types";

export function CurriculumIndexClient({
  students,
  progressByStudent,
}: {
  students: Student[];
  progressByStudent: Record<string, ProgressMap>;
}) {
  const [view, setView] = useState<"students" | "matrix">("matrix");
  const [search, setSearch] = useState("");

  const matrixStudents: MatrixStudent[] = students.map((s) => ({
    id: s.id,
    name: s.name,
    classroom: s.classroom,
    avatar_color: s.avatar_color,
  }));

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.classroom ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Curriculum</h1>
          <p className="text-sm text-slate-500 mt-1">
            Record book — track presentations across the five Montessori areas.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Tracking</p>
          <p className="text-sm font-semibold text-slate-700">{students.length} students</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setView("matrix")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === "matrix" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Grid3x3 className="h-3.5 w-3.5" /> Matrix
        </button>
        <button
          onClick={() => setView("students")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === "students" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="h-3.5 w-3.5" /> By student
        </button>
      </div>

      {view === "matrix" && (
        <CurriculumMatrix students={matrixStudents} progressByStudent={progressByStudent} />
      )}

      {view === "students" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CURRICULUM.map((area) => (
              <div key={area.id} className={`rounded-lg p-2.5 border ${area.tone.border} ${area.tone.soft}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${area.tone.accent}`} />
                  <p className={`text-[11px] font-semibold ${area.tone.text} uppercase tracking-wide truncate`}>
                    {area.name}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-snug">{area.description}</p>
              </div>
            ))}
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              className="pl-9 bg-white border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((student) => {
              const stats = getCurriculumStats(progressByStudent[student.id] ?? {});
              const pct = touchedPercent(stats.overall);
              return (
                <Link key={student.id} href={`/teacher/curriculum/${student.id}`} className="block group">
                  <Card className="border-slate-100 shadow-sm hover:shadow-md hover:border-montessori-primary/30 transition-all h-full">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full ${student.avatar_color} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                          {student.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">{student.name}</p>
                          <p className="text-xs text-slate-500 truncate">{student.classroom ?? "—"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-montessori-primary leading-none">{pct}%</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">touched</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {CURRICULUM.map((area) => {
                          const s = stats.byArea[area.id];
                          const pa = touchedPercent(s);
                          return (
                            <div key={area.id} className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 w-16 truncate">{area.name}</span>
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${area.tone.accent}`} style={{ width: `${pa}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-500 w-9 text-right tabular-nums">{pa}%</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          <span>
                            <span className="font-semibold text-slate-700">{stats.overall.proficient}</span> proficient
                          </span>
                        </div>
                        <span className="flex items-center gap-1 font-medium text-montessori-primary group-hover:gap-1.5 transition-all">
                          Open
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            {filtered.length === 0 && (
              <p className="text-sm text-slate-500 italic col-span-full text-center py-12">
                No students match your search.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
