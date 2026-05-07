"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createObservation,
  getRoleUser,
  getStudentById,
  getStudentObservations,
  getTeacherStudents,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { useToast } from "@/hooks/use-toast";

const PRESET_TAGS = [
  "Practical Life",
  "Sensorial",
  "Language",
  "Mathematics",
  "Cultural",
  "Art",
  "Music",
  "Outdoor",
  "Social",
  "Geography",
  "Research",
  "General",
];

const TAG_COLORS: Record<string, string> = {
  Sensorial: "bg-violet-100 text-violet-700 border-violet-200",
  "Practical Life": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Language: "bg-sky-100 text-sky-700 border-sky-200",
  Mathematics: "bg-amber-100 text-amber-700 border-amber-200",
  Geography: "bg-teal-100 text-teal-700 border-teal-200",
  Art: "bg-pink-100 text-pink-700 border-pink-200",
  Music: "bg-orange-100 text-orange-700 border-orange-200",
  Outdoor: "bg-lime-100 text-lime-700 border-lime-200",
  Social: "bg-rose-100 text-rose-700 border-rose-200",
  Research: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Cultural: "bg-red-100 text-red-700 border-red-200",
  General: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function StudentObservationPage({}: {}) {
  const { toast } = useToast();
  const router = useRouter();
  const routeParams = useParams<{ studentId: string }>();
  useDemoStore();

  const teacher = getRoleUser("teacher");
  const teacherStudents = getTeacherStudents(teacher.id);
  const rawStudentParam = decodeURIComponent(routeParams?.studentId ?? "");

  const normalizeSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

  const student =
    getStudentById(rawStudentParam) ||
    teacherStudents.find(
      (s) => normalizeSlug(s.name) === normalizeSlug(rawStudentParam),
    ) ||
    teacherStudents.find(
      (s) =>
        normalizeSlug(s.name.split(" ")[0]) === normalizeSlug(rawStudentParam),
    );

  const observations = student ? getStudentObservations(student.id) : [];

  const [tag, setTag] = useState("Sensorial");
  const [content, setContent] = useState("");

  if (!student) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Link
          href="/teacher/observations"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-montessori-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-xl font-serif text-slate-900">Student not found</h1>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Observation is empty",
        description: "Add a note before saving.",
      });
      return;
    }
    createObservation({ studentId: student.id, tag, content: content.trim() });
    setContent("");
    toast({
      title: "Observation saved",
      description: `${student.name}'s observation journal has been updated.`,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link
          href="/teacher/observations"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-montessori-primary"
        >
          <ArrowLeft className="w-4 h-4" /> All Observations
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-full ${student.avatarColor} text-white flex items-center justify-center font-bold`}
        >
          {student.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div>
          <h1 className="text-2xl font-serif text-slate-900">{student.name}</h1>
          <p className="text-sm text-slate-500">
            {student.classroom} · Observation journal
          </p>
        </div>
        <div className="ml-auto w-full max-w-[220px]">
          <Select
            value={student.id}
            onValueChange={(value) =>
              router.push(`/teacher/observations/${value}`)
            }
          >
            <SelectTrigger className="bg-white border-slate-200">
              <SelectValue placeholder="Switch student" />
            </SelectTrigger>
            <SelectContent>
              {teacherStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* New observation */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Log New Observation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Tag / Area
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    tag === t
                      ? (TAG_COLORS[t] ??
                        "bg-slate-100 text-slate-700 border-slate-300")
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Observation
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Record what ${student.name.split(" ")[0]} was doing, the material used, and the child's response…`}
              className="min-h-32 border-slate-200 focus-visible:ring-montessori-primary"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              Save Observation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Observation Timeline ({observations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {observations.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No observations logged yet.
            </p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-100" />
              <div className="space-y-6">
                {observations.map((obs) => (
                  <div key={obs.id} className="flex gap-4 pl-1">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-montessori-primary/30 shrink-0 mt-1 z-10" />
                    <div className="flex-1 rounded-xl border border-slate-100 p-4 bg-white shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${TAG_COLORS[obs.tag] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
                        >
                          {obs.tag}
                        </Badge>
                        <p className="text-xs text-slate-400">
                          {new Date(obs.createdAt).toLocaleDateString("en-NG", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {" · "}
                          {new Date(obs.createdAt).toLocaleTimeString("en-NG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {obs.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
