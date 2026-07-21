import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getTeacherClasses, getSubjects } from "@/lib/db/classes";
import { getTimetable } from "@/lib/db/operations";
import type { TimetablePeriod } from "@/lib/db/types";
import { CalendarDays } from "lucide-react";

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

function trimTime(t: string) {
  // "08:00:00" -> "08:00"
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export default async function TeacherTimetablePage() {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  const db = supabase!;

  const [classes, subjects] = await Promise.all([
    getTeacherClasses(db, user.id, school!.id),
    getSubjects(db, school!.id),
  ]);
  const periodsPerClass = await Promise.all(
    classes.map((c) => getTimetable(db, c.id)),
  );
  const periods: TimetablePeriod[] = periodsPerClass.flat();

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));

  const byDay = new Map<number, TimetablePeriod[]>();
  for (const day of DAYS) byDay.set(day.value, []);
  for (const p of periods) byDay.get(p.day_of_week)?.push(p);
  for (const list of byDay.values()) {
    list.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-slate-900 mb-1">Timetable</h1>
        <p className="text-sm text-slate-500">
          Your weekly teaching schedule across all classes and subjects.
        </p>
      </div>

      {periods.length === 0 ? (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <CalendarDays className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-900">
              No periods scheduled
            </p>
            <p className="text-sm text-slate-500 mt-1">
              You have no timetable entries yet. Check back once the
              administrator assigns your periods.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {DAYS.map((day) => {
            const list = byDay.get(day.value) ?? [];
            return (
              <Card key={day.value} className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    {day.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {list.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center border border-dashed rounded-lg border-slate-200">
                      No periods
                    </p>
                  ) : (
                    list.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-slate-100 bg-white p-3"
                      >
                        <p className="text-xs font-medium text-montessori-primary">
                          {trimTime(p.start_time)} – {trimTime(p.end_time)}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          {(p.subject_id && subjectNameById.get(p.subject_id)) ||
                            "Subject"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {classNameById.get(p.class_id) ?? "Class"}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
