"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { clearClassroomPin, updateStudentDetails } from "@/lib/actions/students";
import { ageInMonths, formatAge, roomForAge } from "@/lib/montessori/age-bands";
import type { Classroom, SchoolClass, SchoolType } from "@/lib/db/types";

const NO_CLASS = "__none__";

type Details = {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrolled_at: string | null;
  class_id: string | null;
  classroom: string | null;
  classroom_pinned?: boolean;
};

export function EditDetailsButton({
  student,
  schoolType,
  classes,
  classrooms,
}: {
  student: Details;
  schoolType: SchoolType;
  classes: SchoolClass[];
  classrooms: Classroom[];
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(student.name);
  const [dob, setDob] = useState(student.date_of_birth ?? "");
  const [enrolled, setEnrolled] = useState(student.enrolled_at ?? "");
  const [classId, setClassId] = useState(student.class_id ?? NO_CLASS);
  const isRegular = schoolType === "regular";

  const openDialog = () => {
    setName(student.name);
    setDob(student.date_of_birth ?? "");
    setEnrolled(student.enrolled_at ?? "");
    setClassId(student.class_id ?? NO_CLASS);
    setOpen(true);
  };

  // Montessori: which room the new date of birth leads to.
  const months = dob ? ageInMonths(dob) : null;
  const room = !isRegular && months != null && months >= 0 ? roomForAge(classrooms, months) : null;
  const dobChanged = dob !== (student.date_of_birth ?? "");

  const handleSave = () => {
    start(async () => {
      const res = await updateStudentDetails({
        studentId: student.id,
        name,
        dateOfBirth: dob || null,
        enrolledAt: enrolled || null,
        classId: isRegular ? (classId === NO_CLASS ? null : classId) : undefined,
      });
      if (!res.ok) {
        toast({ title: "Could not save", description: res.error, variant: "destructive" });
        return;
      }
      setOpen(false);
      toast({
        title: "Details updated",
        description:
          dobChanged && room && !student.classroom_pinned && room.name !== student.classroom
            ? `${name.trim()} has been placed in ${room.name} for their age.`
            : `${name.trim()}'s details were saved.`,
      });
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={openDialog}>
        <Pencil className="w-3.5 h-3.5" /> Edit details
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Edit {student.name}</DialogTitle>
            <DialogDescription>
              {isRegular
                ? "Update the child's name, dates and class."
                : "Update the child's name and dates. A date of birth places them in the room for their age."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="d-name" className="text-sm font-medium text-slate-700">
                Name
              </label>
              <Input
                id="d-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-slate-200"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="d-dob" className="text-sm font-medium text-slate-700">
                  Date of birth
                </label>
                <Input
                  id="d-dob"
                  type="date"
                  value={dob}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDob(e.target.value)}
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="d-enrolled" className="text-sm font-medium text-slate-700">
                  Enrolment date
                </label>
                <Input
                  id="d-enrolled"
                  type="date"
                  value={enrolled}
                  onChange={(e) => setEnrolled(e.target.value)}
                  className="border-slate-200"
                />
              </div>
            </div>
            {months != null && months >= 0 && (
              <p className="text-xs text-slate-500 -mt-2">
                {formatAge(months)} old
                {!isRegular &&
                  (student.classroom_pinned
                    ? ` · kept in ${student.classroom ?? "no classroom"} (placed by hand)`
                    : room
                      ? ` · belongs in ${room.name}`
                      : " · no classroom's age range fits yet")}
              </p>
            )}
            {isRegular && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Class</label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value={NO_CLASS}>No class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={pending || !name.trim()}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Shown on the profile when a manual move has pinned the child to a room, so
// the admin can hand them back to automatic age placement.
export function ClassroomPinNotice({
  studentId,
  classroom,
}: {
  studentId: string;
  classroom: string | null;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Pin className="w-4 h-4 shrink-0" />
      <p className="flex-1">
        Kept in {classroom ?? "no classroom"} by hand — this child won&apos;t
        move up automatically as they get older.
      </p>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        className="bg-white"
        onClick={() =>
          start(async () => {
            const res = await clearClassroomPin(studentId);
            toast(
              res.ok
                ? { title: "Automatic placement resumed", description: "They're now in the room for their age." }
                : { title: "Could not resume", description: res.error, variant: "destructive" },
            );
          })
        }
      >
        {pending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
        Place by age
      </Button>
    </div>
  );
}
