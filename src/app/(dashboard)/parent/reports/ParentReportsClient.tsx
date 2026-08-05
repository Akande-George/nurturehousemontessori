"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { Area } from "@/lib/curriculum/curriculum";

export type DayObservation = {
  id: string;
  areaName: string | null;
  areaTone: Area["tone"] | null;
  activityName: string | null;
  leafName: string | null;
  content: string;
  time: string;
};

export type DayGroup = {
  date: string;
  observations: DayObservation[];
  mood: string | null;
  meals: string | null;
  nap: string | null;
};

type ChildLite = { id: string; name: string; avatar_color: string };

function moodEmoji(mood: string | null) {
  switch (mood) {
    case "Happy":
      return "😊";
    case "Sad":
      return "😢";
    case "Neutral":
      return "😐";
    default:
      return null;
  }
}

export function ParentReportsClient({
  children,
  daysByChild,
}: {
  children: ChildLite[];
  daysByChild: Record<string, DayGroup[]>;
}) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(children[0]?.id ?? null);
  const selectedChild = selectedChildId ? children.find((c) => c.id === selectedChildId) ?? null : null;
  const days = selectedChild ? daysByChild[selectedChild.id] ?? [] : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:space-y-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">Daily Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          A day-by-day view of the observations your child&apos;s teacher recorded.
        </p>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                selectedChildId === child.id
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className={`w-5 h-5 rounded-full ${child.avatar_color} text-white flex items-center justify-center text-[10px] font-bold`}>
                {child.name[0]}
              </div>
              {child.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {!selectedChild ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            No children are linked to your account yet.
          </CardContent>
        </Card>
      ) : days.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            No observations recorded yet for {selectedChild.name}. Reports will appear here as
            the teacher logs your child&apos;s day.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {days.map((day) => {
            const mood = moodEmoji(day.mood);
            return (
              <Card key={day.date} className="border-slate-100 shadow-sm overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <p className="font-semibold text-slate-900">
                        {new Date(day.date).toLocaleDateString("en-NG", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                      {day.observations.length} observation{day.observations.length === 1 ? "" : "s"}
                    </Badge>
                    {mood && <span className="text-xl">{mood}</span>}
                    {(day.meals || day.nap) && (
                      <span className="text-xs text-slate-400">
                        {day.meals ? `Meals: ${day.meals}` : ""}
                        {day.meals && day.nap ? " · " : ""}
                        {day.nap ? `Nap: ${day.nap}` : ""}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {day.observations.map((o) => (
                      <div key={o.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {o.areaName && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${o.areaTone ? `${o.areaTone.soft} ${o.areaTone.text} ${o.areaTone.border}` : ""}`}
                            >
                              {o.areaName}
                            </Badge>
                          )}
                          {o.activityName && (
                            <span className="text-sm font-medium text-slate-800">
                              {o.activityName}
                              {o.leafName && o.leafName !== o.activityName && (
                                <span className="font-normal text-slate-500">{" · "}{o.leafName}</span>
                              )}
                            </span>
                          )}
                          <span className="ml-auto text-xs text-slate-400">
                            {new Date(o.time).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{o.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
