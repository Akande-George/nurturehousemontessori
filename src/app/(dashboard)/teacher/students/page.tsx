"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getActivityPostsForStudent,
  getRoleUser,
  getStudentObservations,
  getTeacherStudents,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { BookOpen, Camera, Eye, Search } from "lucide-react";

const AGE_GROUP_COLORS: Record<string, string> = {
  "0-2 years": "bg-sky-100 text-sky-700 border-sky-200",
  "3-6 years": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "7-9 years": "bg-violet-100 text-violet-700 border-violet-200",
};

export default function TeacherStudentsPage() {
  const snapshot = useDemoStore();
  const teacher = getRoleUser("teacher");
  const students = getTeacherStudents(teacher.id);

  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ageGroups = ["All", "0-2 years", "3-6 years", "7-9 years"];

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.classroom.toLowerCase().includes(search.toLowerCase());
    const matchAge = ageFilter === "All" || s.ageGroup === ageFilter;
    return matchSearch && matchAge;
  });

  const selected = students.find((s) => s.id === selectedId) ?? null;
  const selObs = selected ? getStudentObservations(selected.id) : [];
  const selPosts = selected ? getActivityPostsForStudent(selected.id) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">My Students</h1>
          <p className="text-sm text-slate-500 mt-1">
            {students.length} students across all classrooms — click a student
            to view their profile.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or classroom…"
            className="pl-9 bg-white border-slate-200"
          />
        </div>
        <div className="flex gap-2">
          {ageGroups.map((ag) => (
            <button
              key={ag}
              onClick={() => setAgeFilter(ag)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
                ageFilter === ag
                  ? "bg-montessori-primary/10 text-montessori-primary border-montessori-primary/20"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {ag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student list */}
        <div className="lg:col-span-1 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No students match your search.
            </p>
          ) : (
            filtered.map((student) => {
              const isActive = selectedId === student.id;
              const obsCount = getStudentObservations(student.id).length;
              const postCount = getActivityPostsForStudent(student.id).length;
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedId(isActive ? null : student.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? "border-montessori-primary bg-montessori-primary/5"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full ${student.avatarColor} text-white flex items-center justify-center text-sm font-bold shrink-0`}
                  >
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${isActive ? "text-montessori-primary" : "text-slate-900"}`}
                    >
                      {student.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {student.classroom}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs text-slate-400">{obsCount} obs</p>
                    <p className="text-xs text-slate-400">{postCount} posts</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Student detail panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="border-dashed border-slate-200 shadow-none h-full">
              <CardContent className="py-20 text-center text-sm text-slate-400">
                <Eye className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                Select a student to view their profile and history.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              {/* Profile header */}
              <Card className="border-slate-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-16 h-16 rounded-full ${selected.avatarColor} text-white flex items-center justify-center text-xl font-bold shrink-0`}
                    >
                      {selected.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-xl font-serif text-slate-900">
                          {selected.name}
                        </h2>
                        <Badge
                          variant="outline"
                          className={`text-xs ${AGE_GROUP_COLORS[selected.ageGroup] ?? ""}`}
                        >
                          {selected.ageGroup}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mb-3">
                        {selected.classroom}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
                        <div>
                          <span className="text-slate-500 text-xs block">
                            Date of Birth
                          </span>
                          <span className="text-slate-800">
                            {new Date(selected.dateOfBirth).toLocaleDateString(
                              "en-NG",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs block">
                            Enrolled
                          </span>
                          <span className="text-slate-800">
                            {new Date(
                              selected.enrollmentDate,
                            ).toLocaleDateString("en-NG", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs block">
                            Parent
                          </span>
                          <span className="text-slate-800">
                            {selected.parentName}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs block">
                            Emergency
                          </span>
                          <span className="text-slate-800">
                            {selected.emergencyContact.name} (
                            {selected.emergencyContact.relationship})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs block">
                            Emergency Phone
                          </span>
                          <span className="text-slate-800">
                            {selected.emergencyContact.phone}
                          </span>
                        </div>
                        {selected.allergies.length > 0 && (
                          <div>
                            <span className="text-slate-500 text-xs block">
                              Allergies
                            </span>
                            <span className="text-amber-700 font-medium">
                              {selected.allergies.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                      {selected.medicalNotes && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                          ⚠ {selected.medicalNotes}
                        </p>
                      )}
                      {selected.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {selected.interests.map((int) => (
                            <span
                              key={int}
                              className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5"
                            >
                              {int}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-slate-100">
                    <Button
                      asChild
                      className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2"
                    >
                      <Link href={`/teacher/observations/${selected.id}`}>
                        <BookOpen className="w-4 h-4" /> Log Observation
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="bg-white border-slate-200 gap-2"
                    >
                      <Link href="/teacher/activity">
                        <Camera className="w-4 h-4" /> Post Activity
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent observations */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Recent Observations
                    </CardTitle>
                    <Link
                      href={`/teacher/observations/${selected.id}`}
                      className="text-xs text-montessori-primary font-medium hover:underline"
                    >
                      View all →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selObs.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      No observations yet.
                    </p>
                  ) : (
                    selObs.slice(0, 3).map((obs) => (
                      <div
                        key={obs.id}
                        className="rounded-xl border border-slate-100 p-4"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${obs.leaf.areaTone.soft} ${obs.leaf.areaTone.text} ${obs.leaf.areaTone.border}`}
                          >
                            {obs.leaf.areaName} · {obs.leaf.activityName}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {new Date(obs.createdAt).toLocaleDateString(
                              "en-NG",
                              { day: "numeric", month: "short" },
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                          {obs.content}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recent activity posts */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Activity Posts</CardTitle>
                    <Link
                      href="/teacher/activity"
                      className="text-xs text-montessori-primary font-medium hover:underline"
                    >
                      Manage →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {selPosts.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      No activity posts yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {selPosts.slice(0, 6).map((post) => (
                        <div
                          key={post.id}
                          className="relative aspect-square rounded-lg overflow-hidden bg-slate-100"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.imageUrl}
                            alt={post.leaf.activityName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
