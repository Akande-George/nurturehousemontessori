"use client";

import { useState, useTransition } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { moveStudentToClassroom } from "@/lib/actions/students";
import type { Classroom } from "@/lib/db/types";

// Radix Select can't hold an empty value, so "no classroom" gets a sentinel.
const UNASSIGNED = "__unassigned__";

type MoveTarget = { id: string; name: string; classroom: string | null };

export function MoveClassroomDialog({
  student,
  classrooms,
  onClose,
}: {
  // The child being moved; null keeps the dialog closed.
  student: MoveTarget | null;
  classrooms: Classroom[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  // The room picked in this sitting; until then the child's current room.
  const [picked, setPicked] = useState<string | null>(null);
  const current = student?.classroom ?? UNASSIGNED;
  const target = picked ?? current;

  const close = () => {
    setPicked(null);
    onClose();
  };

  const handleMove = () => {
    if (!student) return;
    const classroom = target === UNASSIGNED ? null : target;
    start(async () => {
      const res = await moveStudentToClassroom(student.id, classroom);
      if (!res.ok) {
        toast({
          title: "Could not move student",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Classroom updated",
        description: classroom
          ? `${student.name} is now in ${classroom}.`
          : `${student.name} is no longer in a classroom.`,
      });
      close();
    });
  };

  return (
    <Dialog open={Boolean(student)} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Move {student?.name}</DialogTitle>
          <DialogDescription>
            {student?.classroom
              ? `Currently in ${student.classroom}. Their teachers change with the room.`
              : "Not in a classroom yet. Pick a room to place them in."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <label htmlFor="move-classroom" className="text-sm font-medium text-slate-700">
            Classroom
          </label>
          <Select value={target} onValueChange={setPicked}>
            <SelectTrigger id="move-classroom" className="border-slate-200">
              <SelectValue placeholder="Select a classroom" />
            </SelectTrigger>
            <SelectContent>
              {classrooms.map((room) => (
                <SelectItem key={room.id} value={room.name}>
                  {room.age_group ? `${room.name} · ${room.age_group}` : room.name}
                </SelectItem>
              ))}
              <SelectItem value={UNASSIGNED}>No classroom</SelectItem>
            </SelectContent>
          </Select>
          {classrooms.length === 0 && (
            <p className="text-xs text-slate-400">
              Add classrooms on the Classrooms screen first.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={pending || target === current}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
          >
            {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Move student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Standalone trigger for the student profile page (a server component).
export function MoveClassroomButton({
  student,
  classrooms,
}: {
  student: MoveTarget;
  classrooms: Classroom[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <ArrowRightLeft className="w-3.5 h-3.5" /> Change classroom
      </Button>
      <MoveClassroomDialog
        student={open ? student : null}
        classrooms={classrooms}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
