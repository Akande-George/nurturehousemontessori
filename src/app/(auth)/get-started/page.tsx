"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { GraduationCap, School, ArrowRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { registerSchool } from "@/lib/actions/onboarding";
import type { SchoolType } from "@/lib/db/types";

const TYPES: { value: SchoolType; title: string; blurb: string; icon: typeof School }[] = [
  {
    value: "montessori",
    title: "Montessori School",
    blurb:
      "Observations, curriculum matrix, daily child reports and Montessori progress tracking.",
    icon: GraduationCap,
  },
  {
    value: "regular",
    title: "Regular / Conventional School",
    blurb:
      "Classes, subjects, gradebook, termly report cards with class positions, timetable and homework.",
    icon: School,
  },
];

export default function GetStartedPage() {
  const { toast } = useToast();
  const [type, setType] = useState<SchoolType>("montessori");
  const [name, setName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, start] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adminName.trim() || !adminEmail.trim()) {
      toast({
        title: "Please complete the required fields",
        variant: "destructive",
      });
      return;
    }
    start(async () => {
      const res = await registerSchool({
        schoolName: name.trim(),
        type,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        phone,
      });
      if (res?.error) toast({ title: res.error, variant: "destructive" });
      else setSubmitted(true);
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md text-center animate-pop-in">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 pulse-ring">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-serif text-slate-900 mb-3">
            Registration received
          </h1>
          <p className="text-slate-600 leading-relaxed mb-8">
            Thanks for registering <strong>{name.trim()}</strong>. Your school is
            now waiting for approval from the platform team. We&apos;ll email{" "}
            <strong>{adminEmail.trim()}</strong> as soon as it&apos;s activated —
            then you can sign in with a one-time code.
          </p>
          <Button
            asChild
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
          >
            <Link href="/login">Go to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-montessori-primary mx-auto mb-4 flex items-center justify-center text-white font-serif italic text-xl">
            M
          </div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2">
            Register your school
          </h1>
          <p className="text-slate-500">
            Set up your school portal in under a minute.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8"
        >
          <div className="space-y-3">
            <Label>What kind of school are you?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const selected = type === t.value;
                return (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      selected
                        ? "border-montessori-primary bg-montessori-primary/5 ring-2 ring-montessori-primary/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 mb-2 ${
                        selected ? "text-montessori-primary" : "text-slate-400"
                      }`}
                    />
                    <p className="font-medium text-slate-900">{t.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{t.blurb}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>School Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunrise Academy"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Your Name *</Label>
                <Input
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Head / Principal name"
                />
              </div>
              <div className="space-y-2">
                <Label>Your Email *</Label>
                <Input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="you@school.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <p className="text-xs text-slate-400">
              No password required — you&apos;ll sign in with a one-time code sent
              to your email.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/login"
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Back to sign in
            </Link>
            <Button
              type="submit"
              disabled={pending}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2 disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create School"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
