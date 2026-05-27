"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDateTime,
  getAllObservations,
  getCurriculumStats,
  getRoleUser,
  getStudentById,
  getStudentObservations,
  getTeacherStudents,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { BookOpen, Clock, GraduationCap, Search } from "lucide-react";


export default function TeacherObservationsIndexPage() {
  const snapshot = useDemoStore();
  const teacher = getRoleUser("teacher");
  const students = getTeacherStudents(teacher.id);
  const allObs = getAllObservations();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"students" | "recent">("students");

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.classroom.toLowerCase().includes(search.toLowerCase()),
  );

  const recentObs = allObs.slice(0, 20);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Observations</h1>
          <p className="text-sm text-slate-500 mt-1">
            {allObs.length} total observations across {students.length}{" "}
            students.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["students", "recent"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab === "students" ? "By Student" : "Recent"}
          </button>
        ))}
      </div>

      {activeTab === "students" && (
        <>
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
            {filteredStudents.map((student) => {
              const obsCount = getStudentObservations(student.id).length;
              const latest = getStudentObservations(student.id)[0];
              const curr = getCurriculumStats(student.id);
              const currPct =
                curr.overall.total === 0
                  ? 0
                  : Math.round(
                      ((curr.overall.introduced +
                        curr.overall.developing +
                        curr.overall.proficient) /
                        curr.overall.total) *
                        100,
                    );
              return (
                <Link
                  key={student.id}
                  href={`/teacher/observations/${student.id}`}
                >
                  <Card className="border-slate-100 shadow-sm hover:shadow-md hover:border-montessori-primary/30 transition-all cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-10 h-10 rounded-full ${student.avatarColor} text-white flex items-center justify-center text-sm font-bold shrink-0`}
                        >
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {student.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {student.classroom}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                          <span
                            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5"
                            title={`Curriculum · ${currPct}% touched`}
                          >
                            <GraduationCap className="h-3 w-3" />
                            {currPct}%
                          </span>
                          <span className="text-xs font-semibold text-montessori-primary bg-montessori-primary/10 rounded-full px-2.5 py-0.5">
                            {obsCount}
                          </span>
                        </div>
                      </div>
                      {latest ? (
                        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[11px] py-0 ${latest.leaf.areaTone.soft} ${latest.leaf.areaTone.text} ${latest.leaf.areaTone.border}`}
                            >
                              {latest.leaf.areaName} · {latest.leaf.activityName}
                            </Badge>
                            <span className="text-[10px] text-slate-400">
                              {new Date(latest.createdAt).toLocaleDateString(
                                "en-NG",
                                { day: "numeric", month: "short" },
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {latest.content}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No observations yet — be the first to log one.
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-montessori-primary">
                        <BookOpen className="w-3.5 h-3.5" />
                        Open journal
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "recent" && (
        <div className="space-y-3">
          {recentObs.map((obs) => {
            const student = getStudentById(obs.studentId);
            return (
              <Card key={obs.id} className="border-slate-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-full ${student?.avatarColor ?? "bg-slate-300"} text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}
                    >
                      {student?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("") ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Link
                          href={`/teacher/observations/${obs.studentId}`}
                          className="text-sm font-semibold text-slate-900 hover:text-montessori-primary"
                        >
                          {student?.name}
                        </Link>
                        <Badge
                          variant="outline"
                          className={`text-xs py-0 ${obs.leaf.areaTone.soft} ${obs.leaf.areaTone.text} ${obs.leaf.areaTone.border}`}
                        >
                          {obs.leaf.areaName} · {obs.leaf.activityName}
                          {obs.leaf.leafName !== obs.leaf.activityName && (
                            <span className="opacity-60">
                              {" · "}
                              {obs.leaf.leafName}
                            </span>
                          )}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />{" "}
                          {formatDateTime(obs.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {obs.content}
                      </p>
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
