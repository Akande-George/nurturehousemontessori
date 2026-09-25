"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  CurriculumLeafFields,
  useCurriculumLeaf,
} from "@/components/montessori/CurriculumLeafPicker";
import { createObservation } from "@/lib/actions/montessori";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/lib/db/types";
import type { ObservationWithLeaf } from "@/lib/db/montessori";

export function StudentObservationClient({
  student,
  teacherStudents,
  observations,
}: {
  student: Student;
  teacherStudents: Student[];
  observations: ObservationWithLeaf[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();

  const picker = useCurriculumLeaf();
  const leafId = picker.leafId;
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({ title: "Observation is empty", description: "Add a note before saving." });
      return;
    }
    if (!leafId) {
      toast({ title: "Select a curriculum activity", description: "Choose an area and activity before saving." });
      return;
    }
    start(async () => {
      const res = await createObservation({ studentId: student.id, leafId, content: content.trim() });
      if (res.ok) {
        setContent("");
        toast({
          title: "Observation saved",
          description: `${student.name}'s observation journal has been updated.`,
        });
        router.refresh();
      } else {
        toast({ title: res.error ?? "Failed to save", variant: "destructive" });
      }
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
        <div className={`w-12 h-12 rounded-full ${student.avatar_color} text-white flex items-center justify-center font-bold`}>
          {student.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div>
          <h1 className="text-2xl font-serif text-slate-900">{student.name}</h1>
          <p className="text-sm text-slate-500">{student.classroom ?? "—"} · Observation journal</p>
        </div>
        <div className="ml-auto w-full max-w-[220px]">
          <Select value={student.id} onValueChange={(value) => router.push(`/teacher/observations/${value}`)}>
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

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Log New Observation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CurriculumLeafFields picker={picker} />
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Observation</label>
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
              disabled={!content.trim() || !leafId || pending}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {pending ? "Saving…" : "Save Observation"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Observation Timeline ({observations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {observations.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No observations logged yet.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-100" />
              <div className="space-y-6">
                {observations.map((obs) => (
                  <div key={obs.id} className="flex gap-4 pl-1">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-montessori-primary/30 shrink-0 mt-1 z-10" />
                    <div className="flex-1 rounded-xl border border-slate-100 p-4 bg-white shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          {obs.leaf && (
                            <>
                              <Badge
                                variant="outline"
                                className={`text-xs ${obs.leaf.areaTone.soft} ${obs.leaf.areaTone.text} ${obs.leaf.areaTone.border}`}
                              >
                                {obs.leaf.areaName}
                              </Badge>
                              <span className="text-sm font-medium text-slate-800 truncate">
                                {obs.leaf.activityName}
                                {obs.leaf.leafName !== obs.leaf.activityName && (
                                  <span className="text-slate-500 font-normal">{" · "}{obs.leaf.leafName}</span>
                                )}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 shrink-0">
                          {new Date(obs.created_at).toLocaleDateString("en-NG", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {" · "}
                          {new Date(obs.created_at).toLocaleTimeString("en-NG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{obs.content}</p>
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
