"use client";

import { useTransition } from "react";
import { Check, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { setSchoolStatus } from "@/lib/actions/schools";

export type PendingSchool = {
  id: string;
  name: string;
  slug: string;
  type: string;
  contactEmail: string | null;
  primary: string;
};

export function PendingApprovals({ schools }: { schools: PendingSchool[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  if (schools.length === 0) return null;

  const act = (id: string, name: string, status: "active" | "suspended") => {
    startTransition(async () => {
      const res = await setSchoolStatus(id, status);
      if (!res.ok) {
        toast({ title: "Action failed", description: res.error, variant: "destructive" });
        return;
      }
      toast({
        title: status === "active" ? "School approved" : "Registration declined",
        description:
          status === "active"
            ? `${name} is now active and can be set up by its admin.`
            : `${name} has been declined.`,
      });
    });
  };

  return (
    <Card className="mb-8 border-amber-200 bg-amber-50/40 shadow-sm animate-pop-in">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <Clock className="h-4 w-4" />
          </span>
          <h2 className="font-medium text-slate-900">
            Awaiting approval
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {schools.length}
            </span>
          </h2>
        </div>

        <div className="space-y-3">
          {schools.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-white p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-9 w-9 shrink-0 rounded-lg"
                  style={{ background: `rgb(${s.primary})` }}
                />
                <div>
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    <span className="capitalize">{s.type}</span>
                    {s.contactEmail ? ` · ${s.contactEmail}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => act(s.id, s.name, "suspended")}
                  className="h-9 gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" /> Decline
                </Button>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => act(s.id, s.name, "active")}
                  className="h-9 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
