"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  GraduationCap,
  Megaphone,
  BookOpen,
  Send,
  Palette,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  sendSchoolNotification,
  setSchoolStatus,
  updateSchoolBranding,
} from "@/lib/actions/schools";
import type { School } from "@/lib/db/types";
import type { SchoolStats } from "@/lib/db/schools";

function tripletToHex(t: string): string {
  const p = t.trim().split(/\s+/).map(Number);
  if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return "#000000";
  return "#" + p.map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("");
}
function hexToTriplet(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "0 0 0";
  const int = parseInt(m[1], 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}

export function SchoolDetailClient({
  school,
  stats,
}: {
  school: School;
  stats: SchoolStats;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const isRegular = school.type === "regular";
  const theme = (school.theme ?? {}) as Record<string, string>;

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState(school.name);
  const [contactEmail, setContactEmail] = useState(school.contact_email ?? "");
  const [phone, setPhone] = useState(school.phone ?? "");
  const [address, setAddress] = useState(school.address ?? "");
  const [primary, setPrimary] = useState(tripletToHex(theme.primary ?? "12 92 76"));
  const [secondary, setSecondary] = useState(tripletToHex(theme.secondary ?? "88 160 56"));
  const [accent, setAccent] = useState(tripletToHex(theme.accent ?? "252 211 3"));

  const tiles = [
    { label: "Students", value: Number(stats.student_count), icon: Users },
    { label: "Staff", value: Number(stats.staff_count), icon: GraduationCap },
    {
      label: isRegular ? "Classes" : "Programmes",
      value: isRegular ? Number(stats.class_count) : school.programs.length,
      icon: BookOpen,
    },
    { label: "Notices", value: Number(stats.notice_count), icon: Megaphone },
  ];

  const send = () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Add a title and a message", variant: "destructive" });
      return;
    }
    start(async () => {
      const res = await sendSchoolNotification(school.id, { title: title.trim(), content: message.trim() });
      if (res.ok) {
        setTitle("");
        setMessage("");
        toast({ title: "Notification sent", description: `Posted to ${school.name}.` });
      } else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  const toggleStatus = () => {
    start(async () => {
      const res = await setSchoolStatus(school.id, school.status === "active" ? "suspended" : "active");
      if (res.ok) toast({ title: `School ${school.status === "active" ? "suspended" : "reactivated"}` });
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  const saveBranding = () => {
    start(async () => {
      const res = await updateSchoolBranding(school.id, {
        name,
        contact_email: contactEmail,
        phone,
        address,
        theme: { primary: hexToTriplet(primary), secondary: hexToTriplet(secondary), accent: hexToTriplet(accent) },
      });
      if (res.ok) toast({ title: "Saved" });
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div>
        <Link href="/super-admin/schools" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4">
          <ArrowLeft className="w-4 h-4" /> All schools
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-12 w-12 rounded-xl shrink-0" style={{ background: `rgb(${theme.primary ?? "12 92 76"})` }} />
            <div>
              <h1 className="text-2xl font-serif text-slate-900">{school.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={isRegular ? "bg-indigo-100 text-indigo-700 border-none capitalize" : "bg-emerald-100 text-emerald-700 border-none capitalize"}>
                  {school.type}
                </Badge>
                <span className="text-xs text-slate-400">{school.slug}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled={pending} onClick={toggleStatus}>
            {school.status === "active" ? "Suspend school" : "Reactivate school"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-slate-400 mb-3">
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em]">{stat.label}</span>
                </div>
                <p className="text-3xl font-serif text-slate-900">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-montessori-primary" /> Send a notification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Post an announcement to this school&apos;s notice board. Parents at {school.name} will see it.
          </p>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Platform maintenance on Saturday" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your announcement…" rows={4} />
          </div>
          <Button onClick={send} disabled={pending} className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2">
            <Send className="w-4 h-4" /> Send notification
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Palette className="w-4 h-4 text-montessori-primary" /> Profile &amp; branding
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>School Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Primary", value: primary, set: setPrimary },
              { label: "Secondary", value: secondary, set: setSecondary },
              { label: "Accent", value: accent, set: setAccent },
            ].map((c) => (
              <div key={c.label} className="space-y-2">
                <Label>{c.label}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={c.value} onChange={(e) => c.set(e.target.value)} className="h-10 w-12 rounded border border-slate-200 bg-white p-1" />
                  <Input value={c.value} onChange={(e) => c.set(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={saveBranding} disabled={pending} className="bg-montessori-primary text-white hover:bg-montessori-primary/90">
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
