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
import {
  CalendarClock,
  DoorOpen,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createClassroom,
  deleteClassroom,
  placeSchoolByAge,
  updateClassroom,
} from "@/lib/actions/classrooms";
import type { Classroom } from "@/lib/db/types";
import { formatAgeRange } from "@/lib/montessori/age-bands";

// The standard Montessori age bands, offered as one-click fills for a room's
// age range and label — schools name their rooms however they like.
const BAND_PRESETS = [
  { from: "0", to: "1.5", label: "0–1.5 · Nido" },
  { from: "1.5", to: "3", label: "1.5–3 · Toddler Community" },
  { from: "3", to: "6", label: "3–6 · Children's House" },
  { from: "6", to: "9", label: "6–9 · Lower Elementary" },
  { from: "9", to: "12", label: "9–12 · Upper Elementary" },
];

// Years typed in the form ("1.5") <-> whole months stored on the room.
const toMonths = (years: string) =>
  years.trim() === "" ? null : Math.round(Number(years) * 12);
const toYears = (months: number | null) =>
  months == null ? "" : String(Math.round((months / 12) * 10) / 10);

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
  const [fromYears, setFromYears] = useState("");
  const [upToYears, setUpToYears] = useState("");
  const [removing, setRemoving] = useState<Classroom | null>(null);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setAgeGroup("");
    setFromYears("");
    setUpToYears("");
    setIsOpen(true);
  };

  const openEdit = (classroom: Classroom) => {
    setEditing(classroom);
    setName(classroom.name);
    setAgeGroup(classroom.age_group ?? "");
    setFromYears(toYears(classroom.min_age_months));
    setUpToYears(toYears(classroom.max_age_months));
    setIsOpen(true);
  };

  // Both ends or neither, and both numbers.
  const rangeInvalid =
    [fromYears, upToYears].some((v) => v.trim() !== "" && Number.isNaN(Number(v))) ||
    (fromYears.trim() === "") !== (upToYears.trim() === "");

  const handleSave = () => {
    if (!name.trim() || rangeInvalid) return;
    const input = {
      name,
      ageGroup,
      minAgeMonths: toMonths(fromYears),
      maxAgeMonths: toMonths(upToYears),
    };
    start(async () => {
      const res = editing
        ? await updateClassroom(editing.id, input)
        : await createClassroom(input);
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

  const handlePlace = () => {
    start(async () => {
      const res = await placeSchoolByAge();
      if (!res.ok) {
        toast({
          title: "Could not place children",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Children placed by age",
        description: res.moved
          ? `${res.moved} ${res.moved === 1 ? "child was" : "children were"} moved to the room for their age.`
          : "Everyone is already in the room for their age.",
      });
    });
  };

  const hasRanges = classrooms.some((c) => c.min_age_months != null);

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
            The rooms in your school and the ages each one takes. Children with a
            date of birth are placed in the room for their age and move up as
            they grow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasRanges && (
            <Button
              variant="outline"
              onClick={handlePlace}
              disabled={pending}
              className="gap-2"
            >
              <CalendarClock className="w-4 h-4" /> Place by age now
            </Button>
          )}
          <Button
            onClick={openAdd}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
          >
            <Plus className="w-4 h-4" /> Add Classroom
          </Button>
        </div>
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
                Add each room in your school with the ages it takes. Children
                are then placed by their date of birth, and teachers can be
                assigned to one or more rooms.
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
                const range = formatAgeRange(
                  classroom.min_age_months,
                  classroom.max_age_months,
                );
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
                        {range ?? "No age range — placed by hand only"}
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
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : "Add a classroom"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Change the room's name, age range or label. Its teachers stay with it."
                : "Give the room a name and the ages it takes."}
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
              <Label>
                Age range{" "}
                <span className="text-slate-400 font-normal">(years)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  aria-label="From age, in years"
                  inputMode="decimal"
                  value={fromYears}
                  onChange={(e) => setFromYears(e.target.value)}
                  placeholder="From, e.g. 3"
                  className="border-slate-200"
                />
                <span className="text-sm text-slate-400">to</span>
                <Input
                  aria-label="Up to age, in years"
                  inputMode="decimal"
                  value={upToYears}
                  onChange={(e) => setUpToYears(e.target.value)}
                  placeholder="Up to, e.g. 6"
                  className="border-slate-200"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BAND_PRESETS.map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => {
                      setFromYears(b.from);
                      setUpToYears(b.to);
                      if (!ageGroup.trim()) setAgeGroup(b.label);
                    }}
                    className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600 hover:border-montessori-primary hover:text-montessori-primary"
                  >
                    {b.from}–{b.to}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                A child joins on the day they reach the first age and moves up
                on the day they reach the second. Leave both empty to place
                children here by hand only.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classroom-age">
                Label{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="classroom-age"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                placeholder="e.g. Toddler Community"
                className="border-slate-200"
              />
              <p className="text-xs text-slate-400">
                Shown beside the room when picking one.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={pending || !name.trim() || rangeInvalid}
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
