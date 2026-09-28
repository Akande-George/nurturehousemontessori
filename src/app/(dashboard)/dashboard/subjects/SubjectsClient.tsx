"use client";

import { useState, useTransition } from "react";
import { PlusCircle, BookOpen, Loader2, Pencil, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import {
  createSubject,
  deleteSubject,
  updateSubject,
} from "@/lib/actions/academics";
import type { Subject } from "@/lib/db/types";

export function SubjectsClient({ subjects }: { subjects: Subject[] }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const resetForm = () => {
    setName("");
    setCode("");
    setShowForm(false);
  };

  const [editing, setEditing] = useState<Subject | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [removing, setRemoving] = useState<Subject | null>(null);

  const openEdit = (subject: Subject) => {
    setEditing(subject);
    setEditName(subject.name);
    setEditCode(subject.code ?? "");
  };

  const handleSave = () => {
    if (!editing || !editName.trim()) return;
    start(async () => {
      const res = await updateSubject(editing.id, {
        name: editName.trim(),
        code: editCode.trim(),
      });
      if (!res.ok) {
        toast({
          title: "Could not save subject",
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
      const res = await deleteSubject(removing.id);
      if (!res.ok) {
        toast({
          title: "Could not remove",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Subject removed",
        description: `${removing.name} is gone.`,
      });
      setRemoving(null);
    });
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: "Subject name is required", variant: "destructive" });
      return;
    }
    start(async () => {
      const res = await createSubject({
        name: name.trim(),
        code: code.trim() || undefined,
      });
      if (res.ok) {
        toast({ title: `${name.trim()} added` });
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
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Subjects</h1>
          <p className="text-sm text-slate-500">
            The subjects taught across the school and their codes.
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Add Subject
        </Button>
      </div>

      {showForm && (
        <Card className="border-slate-100 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label>Code (optional)</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. MTH"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={handleCreate}
                disabled={pending}
                className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
              >
                Add Subject
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
          {subjects.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No subjects yet
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Add the subjects taught in your school to start building
                gradebooks and timetables.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium text-slate-900">
                      {subject.name}
                    </TableCell>
                    <TableCell>
                      {subject.code ? (
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-600 border-none font-mono"
                        >
                          {subject.code}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(subject)}
                          aria-label={`Edit ${subject.name}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-montessori-primary transition-colors px-2 py-1.5 rounded-md hover:bg-slate-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => setRemoving(subject)}
                          aria-label={`Remove ${subject.name}`}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
              Rename the subject or change its code. Scores, timetables and
              teacher assignments keep pointing at it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-code">
                Code{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="subject-code"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className="border-slate-200"
              />
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
              Teachers assigned to teach it lose the assignment, and timetable
              periods and homework keep their slot without a subject. A subject
              with recorded scores can&apos;t be removed.
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
