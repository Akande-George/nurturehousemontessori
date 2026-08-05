"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Search, Plus, AlertTriangle, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createStudent } from "@/lib/actions/students";
import type { SchoolClass, SchoolType, Student } from "@/lib/db/types";

type AgeGroup = "infant_0_2" | "primary_3_6" | "lower_7_9";
const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: "infant_0_2", label: "Infant (0–2)" },
  { value: "primary_3_6", label: "Primary (3–6)" },
  { value: "lower_7_9", label: "Lower Elementary (7–9)" },
];

export function StudentsClient({
  students,
  classes,
  classNames,
  schoolType,
}: {
  students: Student[];
  classes: SchoolClass[];
  classNames: Record<string, string>;
  schoolType: SchoolType;
}) {
  const { toast } = useToast();
  const isRegular = schoolType === "regular";
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logType, setLogType] = useState("Observation");
  const [activeClass, setActiveClass] = useState("All");
  const [query, setQuery] = useState("");

  // ---- Add Student ----
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [sName, setSName] = useState("");
  const [sAge, setSAge] = useState<AgeGroup | "">("");
  const [sClassId, setSClassId] = useState("");
  const [sClassroom, setSClassroom] = useState("");
  const [sParentEmail, setSParentEmail] = useState("");
  const [sParentName, setSParentName] = useState("");

  const resetAdd = () => {
    setSName("");
    setSAge("");
    setSClassId("");
    setSClassroom("");
    setSParentEmail("");
    setSParentName("");
  };

  const handleAddStudent = () => {
    if (!sName.trim()) return;
    const payload = {
      name: sName.trim(),
      ageGroup: sAge || undefined,
      classId: isRegular ? sClassId || undefined : undefined,
      classroom: !isRegular ? sClassroom.trim() || undefined : undefined,
      parentEmail: sParentEmail.trim() || undefined,
      parentName: sParentName.trim() || undefined,
    };
    startTransition(async () => {
      const res = await createStudent(payload);
      if (!res.ok) {
        toast({ title: "Could not add student", description: res.error, variant: "destructive" });
        return;
      }
      resetAdd();
      setIsAddOpen(false);
      toast({
        title: res.warning ? "Student added — with a warning" : "Student added",
        description:
          res.warning ??
          (payload.parentEmail
            ? `${payload.name} added and a portal invite was sent to ${payload.parentEmail}.`
            : `${payload.name} was added to your school.`),
        variant: res.warning ? "destructive" : undefined,
      });
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const matchesClass = activeClass === "All" || s.class_id === activeClass;
      const matchesQuery = !q || s.name.toLowerCase().includes(q);
      return matchesClass && matchesQuery;
    });
  }, [students, activeClass, query]);

  const countFor = (classId: string) =>
    students.filter((s) => s.class_id === classId).length;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">
            Student Directory
          </h1>
          <p className="text-sm text-slate-500">
            Monitor attendance, progress, and daily logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students..."
              className="pl-9 w-64 border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsLogOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Log Activity
          </Button>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-1 space-y-4">
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-medium text-slate-900 mb-3 text-sm">
                Classrooms
              </h3>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  onClick={() => setActiveClass("All")}
                  className={`w-full justify-start font-medium ${
                    activeClass === "All"
                      ? "text-montessori-primary bg-montessori-primary/5 hover:bg-montessori-primary/10 hover:text-montessori-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  All Students ({students.length})
                </Button>
                {classes.map((cls) => (
                  <Button
                    key={cls.id}
                    variant="ghost"
                    onClick={() => setActiveClass(cls.id)}
                    className={`w-full justify-start font-medium ${
                      activeClass === cls.id
                        ? "text-montessori-primary bg-montessori-primary/5 hover:bg-montessori-primary/10 hover:text-montessori-primary"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {cls.name} ({countFor(cls.id)})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          {filtered.length === 0 ? (
            <Card className="border-dashed border-slate-200 shadow-none">
              <CardContent className="py-16 text-center text-sm text-slate-500">
                No students match your search.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((student) => {
                const className = student.class_id
                  ? classNames[student.class_id] ?? "Unassigned"
                  : student.classroom ?? "Unassigned";
                const hasAlerts =
                  student.allergies.length > 0 ||
                  (student.medical_notes ?? "").trim().length > 0;
                return (
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    key={student.id}
                    className="block"
                  >
                    <Card className="border-slate-100 shadow-sm hover-lift transition-all group cursor-pointer flex flex-col h-full">
                      <CardContent className="p-5 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full ${student.avatar_color} text-white flex items-center justify-center font-medium shrink-0`}
                            >
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-medium text-slate-900 text-sm group-hover:text-montessori-primary transition-colors">
                                {student.name}
                              </h3>
                              <p className="text-xs text-slate-500">
                                {className}
                                {student.age_group
                                  ? ` • ${student.age_group}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Allergies</span>
                            {student.allergies.length > 0 ? (
                              <Badge
                                variant="secondary"
                                className="bg-amber-100 text-amber-700 font-medium border-none gap-1"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                {student.allergies.length}
                              </Badge>
                            ) : (
                              <span className="font-medium text-slate-700">
                                None
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Medical note</span>
                            <span className="font-medium text-slate-700">
                              {hasAlerts &&
                              (student.medical_notes ?? "").trim().length > 0
                                ? "On file"
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Student Activity</DialogTitle>
            <DialogDescription>
              Record an observation, meal, nap, or incident for a student.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Student Name
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search students..."
                  className="pl-9 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">
                Activity Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  "Observation",
                  "Meal",
                  "Nap",
                  "Toilet",
                  "Medication",
                  "Incident",
                ].map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={logType === type ? "default" : "outline"}
                    onClick={() => setLogType(type)}
                    className={`h-9 text-xs justify-start px-3 font-medium ${
                      logType === type
                        ? "bg-montessori-primary text-white hover:bg-montessori-primary/90 border-transparent shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">
                Notes
              </label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-montessori-primary"
                placeholder={`Add details about this ${logType.toLowerCase()}...`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsLogOpen(false);
                toast({
                  title: "Activity Logged",
                  description: `Successfully recorded ${logType.toLowerCase()} for student.`,
                });
              }}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add a student</DialogTitle>
            <DialogDescription>
              Create a student record. Add a parent email to send them a portal
              invite at the same time.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="s-name" className="text-sm font-medium text-slate-700">
                Student name *
              </label>
              <Input
                id="s-name"
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                placeholder="e.g. Zoe Wong"
                className="border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Age group</label>
                <Select value={sAge} onValueChange={(v) => setSAge(v as AgeGroup)}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isRegular ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Class</label>
                  <Select value={sClassId} onValueChange={setSClassId}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          No classes yet
                        </div>
                      ) : (
                        classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="s-classroom" className="text-sm font-medium text-slate-700">
                    Classroom
                  </label>
                  <Input
                    id="s-classroom"
                    value={sClassroom}
                    onChange={(e) => setSClassroom(e.target.value)}
                    placeholder="e.g. Toddler B"
                    className="border-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mt-3 mb-3">
                Parent portal (optional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="s-pemail" className="text-sm font-medium text-slate-700">
                    Parent email
                  </label>
                  <Input
                    id="s-pemail"
                    type="email"
                    value={sParentEmail}
                    onChange={(e) => setSParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="s-pname" className="text-sm font-medium text-slate-700">
                    Parent name
                  </label>
                  <Input
                    id="s-pname"
                    value={sParentName}
                    onChange={(e) => setSParentName(e.target.value)}
                    placeholder="e.g. Amanda Wong"
                    className="border-slate-200"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                If provided, the parent gets an account linked to this child and an
                email invite to sign in.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddStudent}
              disabled={pending || !sName.trim()}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
