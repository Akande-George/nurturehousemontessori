"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Users,
  ChevronRight,
  GraduationCap,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClass, deleteClass, updateClass } from "@/lib/actions/academics";
import type { SchoolClass } from "@/lib/db/types";

type Staff = { id: string; name: string };

// Radix Select can't hold an empty value, so "no class teacher" gets a sentinel.
const NO_TEACHER = "none";

export function ClassesClient({
  classes,
  staff,
  countByClass,
}: {
  classes: SchoolClass[];
  staff: Staff[];
  countByClass: Record<string, number>;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const staffName = (id: string | null) =>
    staff.find((s) => s.id === id)?.name ?? "Unassigned";

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [classTeacherId, setClassTeacherId] = useState(staff[0]?.id ?? "");

  const resetForm = () => {
    setName("");
    setLevel("");
    setClassTeacherId(staff[0]?.id ?? "");
    setShowForm(false);
  };

  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [editTeacherId, setEditTeacherId] = useState(NO_TEACHER);
  const [removing, setRemoving] = useState<SchoolClass | null>(null);

  const openEdit = (cls: SchoolClass) => {
    setEditing(cls);
    setEditName(cls.name);
    setEditLevel(String(cls.level));
    setEditTeacherId(cls.class_teacher_id ?? NO_TEACHER);
  };

  const handleSave = () => {
    if (!editing) return;
    const levelNum = Number(editLevel);
    if (!editName.trim() || editLevel.trim() === "" || Number.isNaN(levelNum)) {
      toast({
        title: "Enter a name and a numeric level",
        variant: "destructive",
      });
      return;
    }
    start(async () => {
      const res = await updateClass(editing.id, {
        name: editName.trim(),
        level: levelNum,
        classTeacherId: editTeacherId === NO_TEACHER ? null : editTeacherId,
      });
      if (!res.ok) {
        toast({
          title: "Could not save class",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: `${editName.trim()} updated` });
      setEditing(null);
    });
  };

  const handleDelete = () => {
    if (!removing) return;
    start(async () => {
      const res = await deleteClass(removing.id);
      if (!res.ok) {
        toast({
          title: "Could not remove",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Class removed", description: `${removing.name} is gone.` });
      setRemoving(null);
    });
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: "Class name is required", variant: "destructive" });
      return;
    }
    const levelNum = Number(level);
    if (Number.isNaN(levelNum)) {
      toast({ title: "Level must be a number", variant: "destructive" });
      return;
    }
    start(async () => {
      const res = await createClass({
        name: name.trim(),
        level: levelNum,
        classTeacherId: classTeacherId || null,
      });
      if (res.ok) {
        toast({ title: `${name.trim()} created` });
        resetForm();
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Classes</h1>
          <p className="text-sm text-slate-500">
            Every class in the school, its form teacher, and enrolment.
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Add Class
        </Button>
      </div>

      {showForm && (
        <Card className="border-slate-100 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Primary 3"
                />
              </div>
              <div className="space-y-2">
                <Label>Level (ordinal for promotion)</Label>
                <Input
                  type="number"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>
              <div className="space-y-2">
                <Label>Class Teacher</Label>
                <Select value={classTeacherId} onValueChange={setClassTeacherId}>
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
                disabled={pending}
                className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
              >
                Create Class
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-0">
          {classes.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No classes yet
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Create your first class to start assigning teachers, subjects,
                and students.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => {
                  const count = countByClass[cls.id] ?? 0;
                  return (
                    <TableRow key={cls.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/classes/${cls.id}`}
                          className="font-medium text-slate-900 hover:text-montessori-primary transition-colors"
                        >
                          {cls.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {cls.academic_year}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-600 border-none"
                        >
                          {cls.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {staffName(cls.class_teacher_id)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {count}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEdit(cls)}
                            aria-label={`Edit ${cls.name}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-montessori-primary transition-colors px-2 py-1.5 rounded-md hover:bg-slate-100"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => setRemoving(cls)}
                            aria-label={`Remove ${cls.name}`}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5"
                          >
                            <Link href={`/dashboard/classes/${cls.id}`}>
                              Manage <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
            <DialogDescription>
              Change the class name, its promotion level, or its class teacher.
              Students stay in the class.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="class-name">Class Name</Label>
              <Input
                id="class-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-level">Level (ordinal for promotion)</Label>
              <Input
                id="class-level"
                type="number"
                value={editLevel}
                onChange={(e) => setEditLevel(e.target.value)}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Class Teacher</Label>
              <Select value={editTeacherId} onValueChange={setEditTeacherId}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEACHER}>No class teacher</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={pending || !editName.trim()}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save changes
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
              Its timetable, homework and subject-teacher assignments are
              removed with it. A class with students in it, or with recorded
              scores, can&apos;t be removed.
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
