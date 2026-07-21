"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createSchoolBySuperAdmin } from "@/lib/actions/onboarding";
import type { SchoolType } from "@/lib/db/types";

const TYPE_OPTIONS: { value: SchoolType; title: string; desc: string }[] = [
  {
    value: "montessori",
    title: "Montessori",
    desc: "Observations, curriculum matrix, daily child reports, and Montessori progress.",
  },
  {
    value: "regular",
    title: "Regular / Conventional",
    desc: "Classes, subjects, gradebook, termly report cards, timetable, and homework.",
  },
];

export function SchoolForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [type, setType] = useState<SchoolType>("montessori");
  const [name, setName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adminName.trim() || !adminEmail.trim()) {
      toast({ title: "Complete the required fields", variant: "destructive" });
      return;
    }
    start(async () => {
      const res = await createSchoolBySuperAdmin({
        schoolName: name.trim(),
        type,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        phone,
      });
      if (res.ok && res.tempPassword) {
        setCreated({ email: adminEmail.trim(), tempPassword: res.tempPassword });
        toast({ title: `${name.trim()} created` });
      } else {
        toast({ title: res.error ?? "Failed to create school", variant: "destructive" });
      }
    });
  };

  if (created) {
    return (
      <div className="max-w-xl mx-auto space-y-4 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="font-medium text-emerald-800 mb-2">School created 🎉</p>
          <p className="text-sm text-emerald-700">
            Share these temporary sign-in details with the school admin. They can
            change the password after signing in.
          </p>
          <div className="mt-4 rounded-lg bg-white border border-emerald-200 p-4 text-left text-sm font-mono">
            <p>Email: {created.email}</p>
            <p>Temporary password: {created.tempPassword}</p>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => setCreated(null)}>
            Add another
          </Button>
          <Button
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            onClick={() => router.push("/super-admin/schools")}
          >
            Back to schools
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-900">School Type</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TYPE_OPTIONS.map((opt) => {
            const selected = type === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`text-left rounded-xl border p-4 transition-all ${
                  selected
                    ? "border-montessori-primary bg-montessori-primary/5 ring-2 ring-montessori-primary/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="font-medium text-slate-900">{opt.title}</p>
                <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-slate-900">School &amp; Admin</h2>
        <div className="space-y-2">
          <Label>School Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bright Beginnings Academy" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Admin Name *</Label>
            <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Admin Email *</Label>
            <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <p className="text-xs text-slate-400">
          Branding &amp; colors can be set from the school&apos;s detail page after it&apos;s created.
        </p>
      </section>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create School"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/super-admin/schools")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
