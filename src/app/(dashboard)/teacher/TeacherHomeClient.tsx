"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BookOpen, Camera, HeartPulse, Users } from "lucide-react";
import type { Student } from "@/lib/db/types";
import type { Leaf } from "@/lib/curriculum/curriculum";

type RecentObs = {
  id: string;
  student_id: string;
  content: string;
  created_at: string;
  leaf: Leaf | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TeacherHomeClient({
  students,
  recentObs,
  obsCountByStudent,
  postCountByStudent,
  totalObs,
  totalPosts,
  schoolName,
}: {
  students: Student[];
  recentObs: RecentObs[];
  obsCountByStudent: Record<string, number>;
  postCountByStudent: Record<string, number>;
  totalObs: number;
  totalPosts: number;
  schoolName: string;
}) {
  const studentMap = new Map(students.map((s) => [s.id, s]));

  const rosterByClassroom = students.reduce<Record<string, Student[]>>(
    (acc, s) => {
      const key = s.classroom ?? "Unassigned";
      (acc[key] = acc[key] ?? []).push(s);
      return acc;
    },
    {},
  );
  const classrooms = Object.keys(rosterByClassroom);
  const presentToday = students.length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">My Classroom</h1>
          <p className="text-sm text-slate-500 mt-1">
            {schoolName} —{" "}
            {new Date().toLocaleDateString("en-NG", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="bg-white border-slate-200 gap-2">
            <Link href="/teacher/observations">
              <BookOpen className="w-4 h-4" /> Observations
            </Link>
          </Button>
          <Button asChild className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2">
            <Link href="/teacher/activity">
              <Camera className="w-4 h-4" /> Post Activity
            </Link>
          </Button>
        </div>
      </div>

      {classrooms.length > 1 && (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  Classrooms
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  {classrooms.length} classrooms on your roll this term.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {classrooms.map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    {c} · {rosterByClassroom[c]?.length ?? 0}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <MedicalWatchlist students={students} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Students", value: students.length, sub: "on roll" },
          { label: "Present Today", value: presentToday, sub: `of ${students.length}` },
          { label: "Observations", value: totalObs, sub: "logged" },
          { label: "Activity Posts", value: totalPosts, sub: "published" },
        ].map((stat) => (
          <Card key={stat.label} className="border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-serif text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Classroom Roster
            </CardTitle>
            <Link href="/teacher/students" className="text-xs text-montessori-primary font-medium hover:underline">
              Full profiles →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No students on your roll yet.
            </p>
          ) : classrooms.length > 1 ? (
            <div className="space-y-5">
              {classrooms.map((c) => {
                const cohort = rosterByClassroom[c] ?? [];
                if (cohort.length === 0) return null;
                return (
                  <div key={c}>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
                      {c}
                    </p>
                    <div className="divide-y divide-slate-50">
                      {cohort.map((student) => (
                        <RosterRow
                          key={student.id}
                          student={student}
                          obsCount={obsCountByStudent[student.id] ?? 0}
                          postCount={postCountByStudent[student.id] ?? 0}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {students.map((student) => (
                <RosterRow
                  key={student.id}
                  student={student}
                  obsCount={obsCountByStudent[student.id] ?? 0}
                  postCount={postCountByStudent[student.id] ?? 0}
                  showPost
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Observations</CardTitle>
            <Link href="/teacher/observations" className="text-xs text-montessori-primary font-medium hover:underline">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentObs.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No observations logged yet.
            </p>
          ) : (
            recentObs.map((obs) => {
              const student = studentMap.get(obs.student_id);
              return (
                <div key={obs.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${student?.avatar_color ?? "bg-slate-300"} text-white flex items-center justify-center text-[10px] font-bold`}>
                        {student ? initials(student.name) : "?"}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{student?.name}</span>
                      {obs.leaf && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${obs.leaf.areaTone.soft} ${obs.leaf.areaTone.text} ${obs.leaf.areaTone.border}`}
                        >
                          {obs.leaf.areaName} · {obs.leaf.activityName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 shrink-0">{formatDateTime(obs.created_at)}</p>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{obs.content}</p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RosterRow({
  student,
  obsCount,
  postCount,
  showPost,
}: {
  student: Student;
  obsCount: number;
  postCount: number;
  showPost?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
      <div className={`w-9 h-9 rounded-full ${student.avatar_color} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
        {initials(student.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{student.name}</p>
        <p className="text-xs text-slate-500">{student.classroom ?? "—"}</p>
      </div>
      {student.allergies.length > 0 && (
        <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50 hidden sm:flex">
          ⚠ {student.allergies[0]}
        </Badge>
      )}
      <div className="text-right hidden sm:block shrink-0">
        <p className="text-xs text-slate-400">{obsCount} obs · {postCount} posts</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button asChild variant="outline" size="sm" className="text-xs bg-white">
          <Link href={`/teacher/observations/${student.id}`}>Observe</Link>
        </Button>
        {showPost && (
          <Button asChild variant="outline" size="sm" className="text-xs bg-white hidden sm:flex">
            <Link href="/teacher/activity">Post</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function MedicalWatchlist({ students }: { students: Student[] }) {
  const flagged = students.filter(
    (s) => s.allergies.length > 0 || (s.medical_notes ?? "").trim().length > 0,
  );
  if (flagged.length === 0) return null;

  return (
    <Card className="border-2 border-rose-200 shadow-sm bg-rose-50/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-rose-900">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            Medical Watchlist
            <Badge variant="outline" className="bg-white text-rose-700 border-rose-200 ml-1">
              {flagged.length} of {students.length}
            </Badge>
          </CardTitle>
          <p className="text-xs text-rose-700/80 font-medium">Read before pickup</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {flagged.map((student) => (
          <div
            key={student.id}
            className="rounded-xl bg-white border border-rose-100 p-3.5 flex flex-col sm:flex-row gap-3"
          >
            <div className="flex items-center gap-3 min-w-0 sm:w-48 shrink-0">
              <div className={`w-9 h-9 rounded-full ${student.avatar_color} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                {initials(student.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{student.name}</p>
                <p className="text-xs text-slate-500 truncate">{student.classroom ?? "—"}</p>
              </div>
            </div>
            <div className="flex-1 space-y-1.5 text-xs">
              {student.allergies.length > 0 && (
                <p className="flex items-start gap-1.5 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                  <span>
                    <span className="font-semibold">Allergies: </span>
                    {student.allergies.join(", ")}
                  </span>
                </p>
              )}
              {(student.medical_notes ?? "").trim().length > 0 && (
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">Notes: </span>
                  {student.medical_notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
