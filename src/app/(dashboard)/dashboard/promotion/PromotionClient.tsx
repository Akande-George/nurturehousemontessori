"use client";

import { ArrowUpCircle, Users, GraduationCap, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { promoteClass } from "@/lib/actions/academics";
import type { SchoolClass } from "@/lib/db/types";

export function PromotionClient({
  classes,
  countByClass,
}: {
  classes: SchoolClass[];
  countByClass: Record<string, number>;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const nextClassName = (level: number) => {
    const next = classes
      .filter((c) => c.level > level)
      .sort((a, b) => a.level - b.level)[0];
    return next?.name;
  };

  const handlePromote = (classId: string, className: string, level: number) => {
    const next = nextClassName(level);
    if (!next) {
      toast({
        title: "No higher class",
        description: `${className} is the highest level — there is nowhere to promote to.`,
        variant: "destructive",
      });
      return;
    }
    const ok = window.confirm(
      `Promote all students in ${className} to ${next}? This moves every enrolled student up one class level.`,
    );
    if (!ok) return;
    start(async () => {
      const res = await promoteClass(classId);
      if (res.ok)
        toast({ title: "Promoted", description: `${className} → ${next}.` });
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Promotion</h1>
          <p className="text-sm text-slate-500">
            Move a class up to the next level at the end of the session.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 mb-6">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600">
          Promoting a class moves every enrolled student to the next-higher
          class level (the class with the smallest level above the current one).
          This action updates student enrolment immediately.
        </p>
      </div>

      {classes.length === 0 ? (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No classes yet
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Create classes before running end-of-session promotion.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const count = countByClass[cls.id] ?? 0;
            const next = nextClassName(cls.level);
            return (
              <Card key={cls.id} className="border-slate-100 shadow-sm">
                <CardHeader className="p-6 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium text-slate-900">
                      {cls.name}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-600 border-none"
                    >
                      Level {cls.level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="inline-flex items-center gap-1.5 text-sm text-slate-600 mb-4">
                    <Users className="w-4 h-4 text-slate-400" />
                    {count} student{count === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    {next ? (
                      <>
                        Promotes to{" "}
                        <span className="font-medium text-slate-700">
                          {next}
                        </span>
                      </>
                    ) : (
                      "Highest level — no promotion target"
                    )}
                  </p>
                  <Button
                    onClick={() => handlePromote(cls.id, cls.name, cls.level)}
                    disabled={!next || count === 0 || pending}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Promote to next level
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
