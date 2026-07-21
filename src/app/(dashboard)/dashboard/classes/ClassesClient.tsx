"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PlusCircle, Users, ChevronRight, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { createClass } from "@/lib/actions/academics";
import type { SchoolClass } from "@/lib/db/types";

type Staff = { id: string; name: string };

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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
