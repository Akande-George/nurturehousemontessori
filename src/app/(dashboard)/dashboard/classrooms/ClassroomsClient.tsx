"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DoorOpen, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createClassroom,
  deleteClassroom,
  updateClassroom,
} from "@/lib/actions/classrooms";
import type { Classroom } from "@/lib/db/types";

// The standard Montessori age bands, offered as a starting point for the
// editable label — schools name their rooms and bands however they like.
const BAND_HINT =
  "0–1.5 · Nido, 1.5–3 · Toddler Community, 3–6 · Children's House, 6–9 · Lower Elementary, 9–12 · Upper Elementary";

export function ClassroomsClient({
  classrooms,
  countByRoom,
}: {
  classrooms: Classroom[];
  countByRoom: Record<string, number>;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Classroom | null>(null);
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [removing, setRemoving] = useState<Classroom | null>(null);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setAgeGroup("");
    setIsOpen(true);
  };

  const openEdit = (classroom: Classroom) => {
    setEditing(classroom);
    setName(classroom.name);
    setAgeGroup(classroom.age_group ?? "");
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    start(async () => {
      const res = editing
        ? await updateClassroom(editing.id, { name, ageGroup })
        : await createClassroom({ name, ageGroup });
      if (!res.ok) {
        toast({
          title: "Could not save classroom",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      const renamed = editing && editing.name !== name.trim();
      const moved = renamed ? countByRoom[editing.name] ?? 0 : 0;
      setIsOpen(false);
      toast({
        title: editing ? "Classroom updated" : "Classroom added",
        description: renamed
          ? `Renamed to ${name.trim()}${moved ? ` — ${moved} ${moved === 1 ? "child" : "children"} moved with it.` : "."}`
          : `${name.trim()} is ready to assign.`,
      });
    });
  };

  const handleDelete = () => {
    if (!removing) return;
    start(async () => {
      const res = await deleteClassroom(removing.id);
      if (!res.ok) {
        toast({
          title: "Could not remove",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Classroom removed",
        description: `${removing.name} is gone.`,
      });
      setRemoving(null);
    });
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Classrooms</h1>
          <p className="text-sm text-slate-500">
            The rooms in your school and the age group each one covers. Teachers
            are assigned to these rooms.
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
        >
          <Plus className="w-4 h-4" /> Add Classroom
        </Button>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-0">
          {classrooms.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DoorOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No classrooms yet
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Add each room in your school. You can then put children in them
                and assign teachers to cover one or more rooms.
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-3">
                Age groups follow the Montessori bands if you&apos;d like a
                starting point: {BAND_HINT}
              </p>
              <Button
                onClick={openAdd}
                variant="outline"
                className="mt-6 gap-2 text-slate-600"
              >
                <Plus className="w-4 h-4" /> Add your first classroom
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {classrooms.map((classroom) => {
                const children = countByRoom[classroom.name] ?? 0;
                return (
                  <li
                    key={classroom.id}
                    className="flex items-center gap-4 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-montessori-primary/10 text-montessori-primary">
                      <DoorOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">
                        {classroom.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {classroom.age_group || "No age group set"}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="border-none bg-slate-100 text-slate-600 gap-1"
                    >
                      <Users className="w-3 h-3" />
                      {children} {children === 1 ? "child" : "children"}
                    </Badge>
                    <button
                      onClick={() => openEdit(classroom)}
                      aria-label={`Rename or edit ${classroom.name}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-montessori-primary transition-colors px-2 py-1.5 rounded-md hover:bg-slate-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => setRemoving(classroom)}
                      aria-label={`Remove ${classroom.name}`}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : "Add a classroom"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Change the room's name or age-group label. Its children and teachers stay with it."
                : "Give the room a name, and the age group it covers."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="classroom-name">Name</Label>
              <Input
                id="classroom-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nurture Buds"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classroom-age">
                Age group{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="classroom-age"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                placeholder="e.g. 1.5–3 · Toddler Community"
                className="border-slate-200"
              />
              <p className="text-xs text-slate-400">
                Shown beside the room everywhere it appears. {BAND_HINT}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={pending || !name.trim()}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Add classroom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Remove {removing?.name}?</DialogTitle>
            <DialogDescription>
              Teachers assigned to this room lose it. A room with children in it
              can&apos;t be removed — move them first.
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
