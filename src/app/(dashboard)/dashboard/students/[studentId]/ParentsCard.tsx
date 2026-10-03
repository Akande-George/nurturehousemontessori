"use client";

import { useState, useTransition } from "react";
import { Users, UserPlus, Unlink, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { inviteParent, unlinkParent } from "@/lib/actions/invites";
import type { StudentParent } from "@/lib/db/students";

// A child may have several parents; each gets their own portal account.
export function ParentsCard({
  studentId,
  studentName,
  parents,
}: {
  studentId: string;
  studentName: string;
  parents: StudentParent[];
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const add = () => {
    const clean = email.trim();
    if (!clean) {
      toast({ title: "Enter the parent's email", variant: "destructive" });
      return;
    }
    if (parents.some((p) => p.email.toLowerCase() === clean.toLowerCase())) {
      toast({ title: "That parent is already linked", variant: "destructive" });
      return;
    }
    start(async () => {
      const res = await inviteParent({
        email: clean,
        studentId,
        parentName: name.trim() || undefined,
      });
      if (!res.ok) {
        toast({ title: "Could not link parent", description: res.error, variant: "destructive" });
        return;
      }
      setEmail("");
      setName("");
      toast({ title: "Parent linked", description: `${clean} was emailed a sign-in link.` });
    });
  };

  const remove = (p: StudentParent) => {
    const label = p.fullName || p.email;
    if (!window.confirm(`Unlink ${label} from ${studentName}? They will no longer see ${studentName} in the portal.`)) {
      return;
    }
    start(async () => {
      const res = await unlinkParent({ parentId: p.id, studentId });
      if (!res.ok) {
        toast({ title: "Could not unlink", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "Parent unlinked", description: `${label} is no longer linked to ${studentName}.` });
    });
  };

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4 text-montessori-primary" /> Parents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {parents.length > 0 ? (
          <ul className="space-y-2">
            {parents.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {p.fullName || p.email}
                  </p>
                  {p.fullName && p.email && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="w-3 h-3 shrink-0" /> {p.email}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  onClick={() => remove(p)}
                  className="text-slate-400 hover:text-rose-600 shrink-0"
                  aria-label={`Unlink ${p.fullName || p.email}`}
                >
                  <Unlink className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No parents linked yet.</p>
        )}

        <div className="rounded-lg border border-dashed border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Parent email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Parent name (optional)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amanda Wong"
              />
            </div>
          </div>
          <Button
            onClick={add}
            disabled={pending || !email.trim()}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {parents.length > 0 ? "Link another parent" : "Link a parent"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
