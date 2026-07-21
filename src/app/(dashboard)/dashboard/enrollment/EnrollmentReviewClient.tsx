"use client";

import { useState, useTransition } from "react";
import { Check, X, Users, Mail, Phone, Inbox } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { acceptApplication, rejectApplication } from "@/lib/actions/enrollment";
import type { EnrollmentApplication } from "@/lib/db/operations";

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`capitalize ${STATUS_STYLES[status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}
    >
      {status}
    </Badge>
  );
}

export function EnrollmentReviewClient({
  applications,
}: {
  applications: EnrollmentApplication[];
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const accept = (id: string) => {
    setBusyId(id);
    start(async () => {
      const res = await acceptApplication(id);
      setBusyId(null);
      if (res.ok)
        toast({
          title: "Application accepted",
          description: "The student was added and the family notified.",
        });
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  const reject = (id: string) => {
    setBusyId(id);
    start(async () => {
      const res = await rejectApplication(id);
      setBusyId(null);
      if (res.ok) toast({ title: "Application rejected" });
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  const pendingCount = applications.filter(
    (a) => a.status === "submitted",
  ).length;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-slate-900 mb-1">
          Enrollment Applications
        </h1>
        <p className="text-sm text-slate-500">
          Review prospective students. {pendingCount} awaiting review.
        </p>
      </div>

      {applications.length === 0 ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-800">
              No applications yet
            </p>
            <p className="text-sm text-slate-500 mt-1">
              New enrollment applications will appear here for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const isBusy = pending && busyId === app.id;
            return (
              <Card key={app.id} className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="w-9 h-9 rounded-lg bg-montessori-primary/10 text-montessori-primary flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </span>
                      {app.child_name}
                    </CardTitle>
                    <StatusBadge status={app.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">
                      {app.parent_name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {app.parent_email}
                    </span>
                    {app.parent_phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {app.parent_phone}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {app.status === "submitted" && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        onClick={() => accept(app.id)}
                        disabled={isBusy}
                        className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2"
                      >
                        <Check className="w-4 h-4" /> Accept
                      </Button>
                      <Button
                        onClick={() => reject(app.id)}
                        disabled={isBusy}
                        variant="outline"
                        className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <X className="w-4 h-4" /> Reject
                      </Button>
                    </div>
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
