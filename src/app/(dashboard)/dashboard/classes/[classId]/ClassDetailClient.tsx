"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Users, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { assignSubjectTeacher } from "@/lib/actions/academics";
import type { SchoolClass, Student, Subject } from "@/lib/db/types";

type Staff = { id: string; name: string };

export function ClassDetailClient({
  cls,
  students,
  subjects,
  staff,
  assignmentMap,
}: {
  cls: SchoolClass;
  students: Student[];
  subjects: Subject[];
  staff: Staff[];
  assignmentMap: Record<string, string>;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [assignments, setAssignments] =
    useState<Record<string, string>>(assignmentMap);

  const staffName = (id: string | null) =>
    staff.find((s) => s.id === id)?.name ?? "Unassigned";

  const handleAssign = (subjectId: string, teacherId: string) => {
    setAssignments((prev) => ({ ...prev, [subjectId]: teacherId }));
    start(async () => {
      const res = await assignSubjectTeacher({
        classId: cls.id,
        subjectId,
        teacherId,
      });
      if (res.ok) toast({ title: "Teacher assigned" });
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/dashboard/classes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Classes
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            {cls.name}
          </h1>
          <p className="text-sm text-slate-500">
            Level {cls.level} · {cls.academic_year} · Form teacher{" "}
            {staffName(cls.class_teacher_id)}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="bg-montessori-primary/10 text-montessori-primary border-none px-3 py-1"
        >
          {students.length} students
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" /> Class Roster
            </CardTitle>
            <CardDescription>
              Students currently enrolled in {cls.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {students.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">
                No students in this class yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {student.age_group ?? student.classroom ?? ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" /> Subjects &
              Teachers
            </CardTitle>
            <CardDescription>
              Assign a teacher to each subject for this class.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {subjects.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">
                No subjects defined yet. Add subjects first.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Assigned Teacher</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => {
                    const assignedId = assignments[subject.id];
                    return (
                      <TableRow key={subject.id}>
                        <TableCell>
                          <p className="font-medium text-slate-900">
                            {subject.name}
                          </p>
                          {subject.code && (
                            <p className="text-xs text-slate-500">
                              {subject.code}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={assignedId ?? ""}
                            disabled={pending}
                            onValueChange={(value) =>
                              handleAssign(subject.id, value)
                            }
                          >
                            <SelectTrigger className="bg-white border-slate-200 w-full">
                              <SelectValue placeholder="Assign teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {staff.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
    </div>
  );
}
