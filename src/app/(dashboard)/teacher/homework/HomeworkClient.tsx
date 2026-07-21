"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createHomework } from "@/lib/actions/academics";
import type { Homework, SchoolClass, Subject } from "@/lib/db/types";
import { BookOpen, Plus } from "lucide-react";

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function HomeworkClient({
  classes,
  subjects,
  subjectsByClass,
  homeworkByClass,
}: {
  classes: SchoolClass[];
  subjects: Subject[];
  subjectsByClass: Record<string, Subject[]>;
  homeworkByClass: Record<string, Homework[]>;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [classId, setClassId] = useState<string>(classes[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const classSubjects = classId ? subjectsByClass[classId] ?? [] : [];
  const homework = classId ? homeworkByClass[classId] ?? [] : [];
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));

  const activeSubjectId =
    classSubjects.find((s) => s.id === subjectId)?.id ??
    classSubjects[0]?.id ??
    "";

  const canSubmit = Boolean(
    classId && activeSubjectId && title.trim() && dueDate.trim(),
  );

  const handleAssign = () => {
    if (!canSubmit) return;
    start(async () => {
      const res = await createHomework({
        classId,
        subjectId: activeSubjectId,
        title: title.trim(),
        description: description.trim(),
        dueDate,
      });
      if (res.ok) {
        toast({ title: "Homework assigned", description: title.trim() });
        setTitle("");
        setDescription("");
        setDueDate("");
        setSubjectId("");
      } else {
        toast({ title: res.error ?? "Failed to assign", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-slate-900 mb-1">Homework</h1>
        <p className="text-sm text-slate-500">
          Assign homework to your class and track submissions.
        </p>
      </div>

      <div className="mb-6 max-w-xs">
        <Label className="mb-1.5 block text-xs text-slate-500">Class</Label>
        <Select
          value={classId}
          onValueChange={(v) => {
            setClassId(v);
            setSubjectId("");
          }}
        >
          <SelectTrigger className="bg-white border-slate-200">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base">Assign Homework</CardTitle>
            <CardDescription>
              Create a new assignment for this class.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs text-slate-500">
                Subject
              </Label>
              <Select
                value={activeSubjectId}
                onValueChange={(v) => setSubjectId(v)}
                disabled={classSubjects.length === 0}
              >
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {classSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-slate-500">
                Title
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 4 exercises"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-slate-500">
                Description
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions for the students."
                className="min-h-[90px]"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-slate-500">
                Due date
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAssign}
              disabled={!canSubmit || pending}
              className="w-full bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
            >
              <Plus className="w-4 h-4" />
              Assign Homework
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {!classId ? (
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="py-10">
                <p className="text-sm text-slate-500 text-center">
                  Select a class to view its homework.
                </p>
              </CardContent>
            </Card>
          ) : homework.length === 0 ? (
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="py-16 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-900">
                  No homework yet
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Use the form to assign the first piece of homework.
                </p>
              </CardContent>
            </Card>
          ) : (
            homework.map((hw) => (
              <Card key={hw.id} className="border-slate-100 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {hw.title}
                        </p>
                        <Badge
                          variant="outline"
                          className="bg-slate-50 text-slate-600 border-slate-200"
                        >
                          {(hw.subject_id &&
                            subjectNameById.get(hw.subject_id)) ||
                            "Subject"}
                        </Badge>
                      </div>
                      {hw.description && (
                        <p className="text-sm text-slate-500 mt-1.5">
                          {hw.description}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                        Due
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDate(hw.due_date)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
