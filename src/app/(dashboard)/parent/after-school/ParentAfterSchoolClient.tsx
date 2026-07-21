"use client";

import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Moon, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  enrollAfterSchool,
  unenrollAfterSchool,
} from "@/lib/actions/operations";
import type { Student } from "@/lib/db/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export function ParentAfterSchoolClient({
  children,
  enrolledIds,
}: {
  children: Student[];
  enrolledIds: string[];
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const enrolled = new Set(enrolledIds);

  const handleToggle = (
    studentId: string,
    name: string,
    isEnrolled: boolean,
  ) => {
    start(async () => {
      const res = isEnrolled
        ? await unenrollAfterSchool(studentId)
        : await enrollAfterSchool(studentId);
      if (res.ok) {
        toast({
          title: isEnrolled
            ? "Unenrolled from After School Care"
            : "Enrolled in After School Care",
          description: isEnrolled
            ? `${name.split(" ")[0]} has been removed from the programme.`
            : `${name.split(" ")[0]} is now enrolled. The school will be in touch with details.`,
        });
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  const recommended = children.filter(
    (c) => c.frequent_late_pickup && !enrolled.has(c.id),
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">After School Care</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enrol your child in the After School programme (3:15 PM – 6:00 PM).
        </p>
      </div>

      {/* Info card */}
      <Card className="border-montessori-primary/20 bg-montessori-primary/5 shadow-none">
        <CardContent className="p-5 flex flex-col sm:flex-row gap-5">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-montessori-primary" />
              <p className="font-semibold text-slate-900">
                After School Programme
              </p>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-montessori-primary font-bold mt-0.5">·</span>
                <span>Available Monday to Friday, 3:15 PM – 6:00 PM</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-montessori-primary font-bold mt-0.5">·</span>
                <span>
                  Supervised free play, guided activities, and light snack
                  provided
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-montessori-primary font-bold mt-0.5">·</span>
                <span>
                  Monthly fee applies — invoice will be generated upon enrolment
                </span>
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-sm shrink-0">
            <Clock className="w-4 h-4 text-montessori-primary" />
            <span className="text-slate-600">3:15 PM – 6:00 PM</span>
          </div>
        </CardContent>
      </Card>

      {/* Children */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Your Children</h2>
        {children.length === 0 ? (
          <Card className="border-dashed border-slate-200 shadow-none">
            <CardContent className="py-12 text-center text-sm text-slate-500">
              No children are linked to your account yet.
            </CardContent>
          </Card>
        ) : (
          children.map((child) => {
            const isEnrolled = enrolled.has(child.id);
            return (
              <Card key={child.id} className="border-slate-100 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-full ${child.avatar_color} text-white flex items-center justify-center font-bold text-sm shrink-0`}
                  >
                    {initials(child.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{child.name}</p>
                    <p className="text-xs text-slate-500">
                      {child.classroom ?? ""}
                    </p>
                  </div>
                  {isEnrolled ? (
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border">
                        Enrolled
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          handleToggle(child.id, child.name, true)
                        }
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Unenrol
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => handleToggle(child.id, child.name, false)}
                      className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shrink-0"
                    >
                      Enrol Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Late pickup recommendation */}
      {recommended.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60 shadow-none">
          <CardContent className="p-5 flex items-start gap-4">
            <Star className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="font-semibold text-amber-900">
                After School Care Recommended
              </p>
              <p className="text-sm text-amber-800">
                We&apos;ve noticed that{" "}
                {recommended.map((c) => c.name.split(" ")[0]).join(" and ")}{" "}
                {recommended.length === 1 ? "is" : "are"} frequently picked up
                after school hours. Enrolling in our After School Care programme
                ensures supervised, purposeful time until you arrive — and
                removes any late collection concerns.
              </p>
              {recommended.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  disabled={pending}
                  onClick={() => handleToggle(c.id, c.name, false)}
                  className="bg-amber-600 hover:bg-amber-700 text-white mt-1"
                >
                  Enrol {c.name.split(" ")[0]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
