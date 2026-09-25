"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  CurriculumLeafFields,
  useCurriculumLeaf,
} from "@/components/montessori/CurriculumLeafPicker";
import { createBulkObservations } from "@/lib/actions/montessori";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/lib/db/types";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("");
}

export function BulkObservationClient({ students }: { students: Student[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const picker = useCurriculumLeaf();
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Children grouped by room, so a whole classroom can be ticked at once.
  const groups = useMemo(() => {
    const byRoom = new Map<string, Student[]>();
    for (const s of students) {
      const room = s.classroom ?? "No classroom";
      byRoom.set(room, [...(byRoom.get(room) ?? []), s]);
    }
    return [...byRoom.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [students]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const setMany = (ids: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const count = selected.size;

  const handleSubmit = () => {
    start(async () => {
      const res = await createBulkObservations({
        studentIds: [...selected],
        leafId: picker.leafId,
        content,
      });
      if (!res.ok) {
        toast({ title: "Could not save", description: res.error, variant: "destructive" });
        return;
      }
      toast({
        title: "Observations saved",
        description: `Added to ${res.count} ${res.count === 1 ? "child's" : "children's"} journals.`,
      });
      setContent("");
      setSelected(new Set());
      router.refresh();
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/teacher/observations"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-montessori-primary"
      >
        <ArrowLeft className="w-4 h-4" /> All Observations
      </Link>

      <div>
        <h1 className="text-2xl font-serif text-slate-900">Bulk observation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Log one observation for several children — a group presentation or a
          shared activity. It is added to each child&apos;s journal.
        </p>
      </div>

      {students.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            You have no children assigned yet. Ask an admin to assign you a
            classroom.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <Card className="border-slate-100 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Children</CardTitle>
              <button
                type="button"
                onClick={() =>
                  setMany(
                    students.map((s) => s.id),
                    count !== students.length,
                  )
                }
                className="text-xs font-medium text-montessori-primary hover:underline"
              >
                {count === students.length ? "Clear all" : "Select all"}
              </button>
            </CardHeader>
            <CardContent className="space-y-5">
              {groups.map(([room, kids]) => {
                const ids = kids.map((k) => k.id);
                const allOn = ids.every((id) => selected.has(id));
                return (
                  <div key={room}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                        {room}
                      </p>
                      <button
                        type="button"
                        onClick={() => setMany(ids, !allOn)}
                        className="text-xs text-slate-500 hover:text-montessori-primary"
                      >
                        {allOn ? "Clear room" : "Whole room"}
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {kids.map((s) => (
                        <li key={s.id}>
                          <label className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 cursor-pointer">
                            <Checkbox
                              checked={selected.has(s.id)}
                              onCheckedChange={() => toggle(s.id)}
                              aria-label={s.name}
                            />
                            <span
                              className={`w-7 h-7 rounded-full ${s.avatar_color} text-white flex items-center justify-center text-[11px] font-bold shrink-0`}
                            >
                              {initials(s.name)}
                            </span>
                            <span className="text-sm text-slate-800">{s.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Observation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CurriculumLeafFields picker={picker} />
              <div>
                <label
                  htmlFor="bulk-content"
                  className="text-sm font-medium text-slate-700 block mb-2"
                >
                  Note
                </label>
                <Textarea
                  id="bulk-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Record the presentation, the material used, and how the group responded…"
                  className="min-h-32 border-slate-200 focus-visible:ring-montessori-primary"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Users className="w-4 h-4" />
                  {count === 0
                    ? "No children selected"
                    : `${count} ${count === 1 ? "child" : "children"} selected`}
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={pending || count === 0 || !content.trim() || !picker.leafId}
                  className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
                >
                  {pending
                    ? "Saving…"
                    : count > 1
                      ? `Save for ${count} children`
                      : "Save observation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
