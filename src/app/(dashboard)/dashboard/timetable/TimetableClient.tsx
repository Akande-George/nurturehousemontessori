"use client";

import { useState, useTransition } from "react";
import {
  PlusCircle,
  CalendarDays,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  createTimetablePeriod,
  deleteTimetablePeriod,
  updateTimetablePeriod,
} from "@/lib/actions/academics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { SchoolClass, Subject, TimetablePeriod } from "@/lib/db/types";

type Staff = { id: string; name: string };

// Radix Select can't hold an empty value, so "no teacher" gets a sentinel.
const NO_TEACHER = "none";

// Stored times may carry seconds ("08:00:00"); <input type="time"> wants HH:MM.
const toHHMM = (t: string) => (t.length >= 5 ? t.slice(0, 5) : t);

const DAYS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

export function TimetableClient({
  classes,
  subjects,
  staff,
  periodsByClass,
}: {
  classes: SchoolClass[];
  subjects: Subject[];
  staff: Staff[];
  periodsByClass: Record<string, TimetablePeriod[]>;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const staffName = (id: string | null) =>
    staff.find((s) => s.id === id)?.name ?? "Unassigned";
  const subjectName = (id: string | null) =>
    id ? subjects.find((s) => s.id === id)?.name ?? "Subject" : "No subject";

  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [showForm, setShowForm] = useState(false);
  const [day, setDay] = useState("1");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:40");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(staff[0]?.id ?? "");

  const [editing, setEditing] = useState<TimetablePeriod | null>(null);
  const [editDay, setEditDay] = useState("1");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editTeacherId, setEditTeacherId] = useState(NO_TEACHER);
  const [removing, setRemoving] = useState<TimetablePeriod | null>(null);

  const periods = classId ? periodsByClass[classId] ?? [] : [];
  const periodsByDay = (d: number) =>
    periods.filter((p) => p.day_of_week === d);

  const resetForm = () => {
    setDay("1");
    setStartTime("08:00");
    setEndTime("08:40");
    setSubjectId(subjects[0]?.id ?? "");
    setTeacherId(staff[0]?.id ?? "");
    setShowForm(false);
  };

  const openEdit = (p: TimetablePeriod) => {
    setEditing(p);
    setEditDay(String(p.day_of_week));
    setEditStart(toHHMM(p.start_time));
    setEditEnd(toHHMM(p.end_time));
    setEditSubjectId(p.subject_id ?? "");
    setEditTeacherId(p.teacher_id ?? NO_TEACHER);
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editSubjectId) {
      toast({ title: "Select a subject", variant: "destructive" });
      return;
    }
    start(async () => {
      const res = await updateTimetablePeriod(editing.id, {
        dayOfWeek: Number(editDay),
        startTime: editStart,
        endTime: editEnd,
        subjectId: editSubjectId,
        teacherId: editTeacherId === NO_TEACHER ? null : editTeacherId,
      });
      if (!res.ok) {
        toast({
          title: "Could not save period",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Period updated" });
      setEditing(null);
    });
  };

  const handleDelete = () => {
    if (!removing) return;
    start(async () => {
      const res = await deleteTimetablePeriod(removing.id);
      if (!res.ok) {
        toast({
          title: "Could not remove",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Period removed" });
      setRemoving(null);
    });
  };

  const handleCreate = () => {
    if (!classId) {
      toast({ title: "Select a class first", variant: "destructive" });
      return;
    }
    if (!subjectId) {
      toast({ title: "Select a subject", variant: "destructive" });
      return;
    }
    start(async () => {
      const res = await createTimetablePeriod({
        classId,
        dayOfWeek: Number(day),
        startTime,
        endTime,
        subjectId,
        teacherId: teacherId || null,
      });
      if (res.ok) {
        toast({ title: "Period added" });
        resetForm();
      } else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Timetable</h1>
          <p className="text-sm text-slate-500">
            The weekly class schedule, Monday to Friday.
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          disabled={!classId}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Add Period
        </Button>
      </div>

      <Card className="border-slate-100 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="max-w-xs space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {showForm && classId && (
        <Card className="border-slate-100 shadow-sm mb-6">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle className="text-base font-medium">Add Period</CardTitle>
            <CardDescription>
              Schedule a new lesson in the weekly grid.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={handleCreate}
                className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
              >
                Add Period
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!classId ? (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No class selected
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Create a class first, then pick it above to build its timetable.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {DAYS.map((d) => {
            const dayPeriods = periodsByDay(d.value);
            return (
              <Card key={d.value} className="border-slate-100 shadow-sm">
                <CardHeader className="p-4 border-b border-slate-100">
                  <CardTitle className="text-sm font-medium text-slate-900">
                    {d.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {dayPeriods.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      No periods
                    </p>
                  ) : (
                    dayPeriods.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => openEdit(p)}
                        aria-label={`Edit ${subjectName(p.subject_id)} period, ${p.start_time} to ${p.end_time}`}
                        className="block w-full text-left rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-montessori-primary/40 hover:bg-white"
                      >
                        <p className="text-xs font-medium text-montessori-primary flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {p.start_time}–{p.end_time}
                        </p>
                        <p className="text-sm font-medium text-slate-900 mt-1">
                          {subjectName(p.subject_id)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {staffName(p.teacher_id)}
                        </p>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit period</DialogTitle>
            <DialogDescription>
              Move the lesson to another day or time, or change its subject or
              teacher.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Day</Label>
              <Select value={editDay} onValueChange={setEditDay}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-start">Start Time</Label>
              <Input
                id="period-start"
                type="time"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-end">End Time</Label>
              <Input
                id="period-end"
                type="time"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={editSubjectId} onValueChange={setEditSubjectId}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select value={editTeacherId} onValueChange={setEditTeacherId}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEACHER}>Unassigned</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRemoving(editing);
                setEditing(null);
              }}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </Button>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={pending}
                className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
              >
                {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Remove this period?</DialogTitle>
            <DialogDescription>
              {removing
                ? `${subjectName(removing.subject_id)}, ${
                    DAYS.find((d) => d.value === removing.day_of_week)?.label ?? ""
                  } ${removing.start_time}–${removing.end_time} comes off the timetable.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={pending}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
