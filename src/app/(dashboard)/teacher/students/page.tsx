import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/context";
import { ageGroupLabel } from "@/lib/montessori/age-bands";
import { createClient } from "@/supabase/server";
import { getTeacherClasses } from "@/lib/db/classes";
import { getTeacherClassrooms } from "@/lib/db/classrooms";
import { getClassStudents, getTeacherStudents } from "@/lib/db/students";
import type { Student } from "@/lib/db/types";
import { Users } from "lucide-react";

function formatDob(dob: string | null) {
  if (dob) {
    const d = new Date(dob);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  return "—";
}

export default async function TeacherStudentsPage() {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  const db = supabase!;

  // Montessori groups children by classroom, regular schools by class.
  let groups: { title: string; students: Student[] }[] = [];
  let groupNoun = "class";
  let emptyMessage = "You are not assigned to any class yet.";

  if (school!.type === "montessori") {
    groupNoun = "classroom";
    emptyMessage = "You are not assigned to any classroom yet.";
    const [students, classrooms] = await Promise.all([
      getTeacherStudents(db, {
        teacherId: user.id,
        schoolId: school!.id,
        schoolType: school!.type,
      }),
      getTeacherClassrooms(db, user.id, school!.id),
    ]);
    // Only the teacher's own rooms, shown even when one is empty. With no
    // assignment they see no children and no rooms at all.
    groups = classrooms.map((title) => ({
      title,
      students: students.filter((s) => (s.classroom ?? "") === title),
    }));
  } else {
    const classes = await getTeacherClasses(db, user.id, school!.id);
    const rosters = await Promise.all(
      classes.map((c) => getClassStudents(db, c.id)),
    );
    groups = classes.map((cls, i) => ({
      title: cls.name,
      students: rosters[i],
    }));
  }

  const total = groups.reduce((sum, g) => sum + g.students.length, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">My Students</h1>
        <p className="text-sm text-slate-500 mt-1">
          {total} student{total === 1 ? "" : "s"} across {groups.length}{" "}
          {groupNoun}
          {groups.length === 1 ? "" : "s"}.
        </p>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 flex flex-col items-center text-center text-slate-400">
            <Users className="w-8 h-8 mb-3 text-slate-300" />
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.title} className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {group.title}
                <Badge
                  variant="outline"
                  className="bg-slate-50 text-slate-600 border-slate-200"
                >
                  {group.students.length} student
                  {group.students.length === 1 ? "" : "s"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group.students.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center border border-dashed rounded-xl border-slate-200">
                  No students are enrolled in this {groupNoun} yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Student</TableHead>
                        <TableHead>Age group</TableHead>
                        <TableHead>Date of birth</TableHead>
                        <TableHead>Classroom</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full ${student.avatar_color} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                              >
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <span className="font-medium text-slate-900">
                                {student.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {ageGroupLabel(student.age_group) ?? "—"}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {formatDob(student.date_of_birth)}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {student.classroom ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
