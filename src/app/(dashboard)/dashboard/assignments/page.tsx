"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  addTeacherClassroom,
  getAllClassroomNames,
  getAllTeacherAssignments,
  removeTeacherClassroom,
  setTeacherClassrooms,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { Plus, Users, X } from "lucide-react";

export default function ClassAssignmentsPage() {
  const store = useDemoStore();
  const { toast } = useToast();
  const assignments = getAllTeacherAssignments();
  const allClassrooms = getAllClassroomNames();

  const teachers = useMemo(
    () =>
      Object.values(store.users).filter((u) => u.role === "teacher"),
    [store.users],
  );

  const [customRoom, setCustomRoom] = useState<Record<string, string>>({});

  const addRoom = (teacherId: string, classroom: string) => {
    if (!classroom.trim()) return;
    addTeacherClassroom(teacherId, classroom.trim());
    setCustomRoom((prev) => ({ ...prev, [teacherId]: "" }));
    toast({
      title: "Class assigned",
      description: `${classroom} added to this teacher's roster.`,
    });
  };

  const removeRoom = (teacherId: string, classroom: string) => {
    removeTeacherClassroom(teacherId, classroom);
    toast({
      title: "Class unassigned",
      description: `${classroom} removed.`,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">
          Class Assignments
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Assign one or more classes to each teacher. Teachers see every
          student from every class they hold.
        </p>
      </div>

      {teachers.map((teacher) => {
        const current = assignments[teacher.id] ?? [];
        const available = allClassrooms.filter((c) => !current.includes(c));
        return (
          <Card key={teacher.id} className="border-slate-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-montessori-primary" />
                  {teacher.name}
                </CardTitle>
                <Badge variant="outline" className="bg-white">
                  {current.length} class{current.length === 1 ? "" : "es"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current assignments */}
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                  Assigned classes
                </p>
                {current.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">
                    No classes assigned yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {current.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium"
                      >
                        {c}
                        <button
                          onClick={() => removeRoom(teacher.id, c)}
                          className="text-emerald-600 hover:text-rose-600 transition-colors"
                          aria-label={`Remove ${c}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Available rooms */}
              {available.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                    Available classes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {available.map((c) => (
                      <button
                        key={c}
                        onClick={() => addRoom(teacher.id, c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-dashed border-slate-300 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors text-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom new class */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                  Add a new class
                </p>
                <div className="flex gap-2">
                  <Input
                    value={customRoom[teacher.id] ?? ""}
                    onChange={(e) =>
                      setCustomRoom((prev) => ({
                        ...prev,
                        [teacher.id]: e.target.value,
                      }))
                    }
                    placeholder="e.g. Nurture Stars"
                    className="bg-white"
                  />
                  <Button
                    onClick={() =>
                      addRoom(teacher.id, customRoom[teacher.id] ?? "")
                    }
                    disabled={!customRoom[teacher.id]?.trim()}
                    className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {current.length > 1 && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setTeacherClassrooms(teacher.id, []);
                      toast({
                        title: "All classes unassigned",
                        description: `${teacher.name} now has no classes.`,
                      });
                    }}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Unassign all classes
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
