"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  CurriculumLeafFields,
  useCurriculumLeaf,
} from "@/components/montessori/CurriculumLeafPicker";
import { ObservationActions } from "@/components/montessori/ObservationActions";
import { createObservation } from "@/lib/actions/montessori";
import { useToast } from "@/hooks/use-toast";
import type { Area } from "@/lib/curriculum/curriculum";
import type { ObservationWithLeaf } from "@/lib/db/montessori";

/**
 * The observations half of a child's record book: log an observation against
 * one or more curriculum leaves, then read the journal back. Lifted out of the
 * old standalone observations screen so the record book can host it in a tab.
 */
export function StudentObservationsPanel({
  student,
  observations,
  catalog,
  currentUserId,
}: {
  student: { id: string; name: string };
  observations: ObservationWithLeaf[];
  /** The school's full catalog (hidden nodes included) for the picker. */
  catalog: Area[];
  currentUserId: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();

  const picker = useCurriculumLeaf(catalog, null, { multiple: true });
  const leafIds = picker.leafIds;
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (leafIds.length === 0) {
      toast({
        title: "Select a curriculum activity",
        description: "Choose an area, activity and at least one variation before saving.",
      });
      return;
    }
    start(async () => {
      const res = await createObservation({
        studentId: student.id,
        leafIds,
        content: content.trim(),
      });
      if (res.ok) {
        setContent("");
        toast({
          title: res.count && res.count > 1 ? `${res.count} observations saved` : "Observation saved",
          description: `${student.name}'s observation journal has been updated.`,
        });
        router.refresh();
      } else {
        toast({ title: res.error ?? "Failed to save", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Log new observation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CurriculumLeafFields picker={picker} />
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Observation <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Record what ${student.name.split(" ")[0]} was doing, the material used, and the child's response…`}
              className="min-h-32 border-slate-200 focus-visible:ring-montessori-primary"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={leafIds.length === 0 || pending}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {pending ? "Saving…" : "Save observation"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Observation timeline ({observations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {observations.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No observations logged yet.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-100" />
              <div className="space-y-6">
                {observations.map((obs) => (
                  <div key={obs.id} className="flex gap-4 pl-1">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-montessori-primary/30 shrink-0 mt-1 z-10" />
                    <div className="flex-1 rounded-xl border border-slate-100 p-4 bg-white shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          {obs.leaf && (
                            <>
                              <Badge
                                variant="outline"
                                className={`text-xs ${obs.leaf.areaTone.soft} ${obs.leaf.areaTone.text} ${obs.leaf.areaTone.border}`}
                              >
                                {obs.leaf.areaName}
                              </Badge>
                              <span className="text-sm font-medium text-slate-800 truncate">
                                {obs.leaf.activityName}
                                {obs.leaf.leafName !== obs.leaf.activityName && (
                                  <span className="text-slate-500 font-normal">
                                    {" · "}
                                    {obs.leaf.leafName}
                                  </span>
                                )}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-xs text-slate-400">
                            {new Date(obs.created_at).toLocaleDateString("en-NG", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {" · "}
                            {new Date(obs.created_at).toLocaleTimeString("en-NG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {obs.teacher_id === currentUserId && (
                            <ObservationActions observation={obs} catalog={catalog} />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {obs.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
