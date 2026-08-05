"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Palette,
  Save,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateSchoolBranding } from "@/lib/actions/schools";
import { inviteStaff, removeStaff } from "@/lib/actions/staff";
import { readTheme, type School } from "@/lib/db/types";
import type { StaffMember } from "@/lib/db/staff";

// "12 92 76" -> "#0c5c4c"
function tripletToHex(triplet: string): string {
  const parts = triplet.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return "#000000";
  return (
    "#" +
    parts
      .map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0"))
      .join("")
  );
}
// "#0c5c4c" -> "12 92 76"
function hexToTriplet(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "0 0 0";
  const int = parseInt(m[1], 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}

export function SettingsClient({
  school,
  staff,
  currentUserId,
}: {
  school: School;
  staff: StaffMember[];
  currentUserId: string;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const theme = readTheme(school.theme);

  // ---- Staff management ----
  const [staffPending, startStaff] = useTransition();
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState<"teacher" | "admin">("teacher");

  const handleInviteStaff = () => {
    if (!staffEmail.trim()) return;
    const payload = {
      email: staffEmail.trim(),
      name: staffName.trim() || undefined,
      role: staffRole,
    };
    startStaff(async () => {
      const res = await inviteStaff(payload);
      if (!res.ok) {
        toast({ title: "Could not add staff", description: res.error, variant: "destructive" });
        return;
      }
      setStaffEmail("");
      setStaffName("");
      setStaffRole("teacher");
      setIsStaffOpen(false);
      toast({ title: "Staff invited", description: `${payload.email} now has access.` });
    });
  };

  const handleRemoveStaff = (member: StaffMember) => {
    startStaff(async () => {
      const res = await removeStaff(member.userId);
      if (!res.ok) {
        toast({ title: "Could not remove", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "Access removed", description: `${member.name} can no longer sign in.` });
    });
  };

  const [name, setName] = useState(school.name);
  const [contactEmail, setContactEmail] = useState(school.contact_email ?? "");
  const [phone, setPhone] = useState(school.phone ?? "");
  const [address, setAddress] = useState(school.address ?? "");
  const [primary, setPrimary] = useState(tripletToHex(theme.primary));
  const [secondary, setSecondary] = useState(tripletToHex(theme.secondary));
  const [accent, setAccent] = useState(tripletToHex(theme.accent));

  const handleSave = () => {
    start(async () => {
      const res = await updateSchoolBranding(school.id, {
        name,
        contact_email: contactEmail,
        phone,
        address,
        theme: {
          primary: hexToTriplet(primary),
          secondary: hexToTriplet(secondary),
          accent: hexToTriplet(accent),
        },
      });
      if (res.ok) {
        toast({
          title: "Settings Saved",
          description: "Your school profile and branding have been updated.",
        });
      } else {
        toast({ title: res.error ?? "Failed to save", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">School Settings</h1>
          <p className="text-sm text-slate-500">Manage your institution&apos;s profile, branding, and preferences.</p>
        </div>

        <Button onClick={handleSave} disabled={pending} className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2">
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-8 bg-transparent gap-4 overflow-x-auto w-full justify-start h-auto p-0 rounded-none border-b border-slate-200">
          <TabsTrigger value="general" className="data-[state=active]:border-montessori-primary data-[state=active]:text-montessori-primary border-b-2 border-transparent rounded-none px-4 py-3 font-medium text-slate-500 gap-2">
            <Building2 className="w-4 h-4" /> General
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:border-montessori-primary data-[state=active]:text-montessori-primary border-b-2 border-transparent rounded-none px-4 py-3 font-medium text-slate-500 gap-2">
            <Users className="w-4 h-4" /> Team & Staff
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:border-montessori-primary data-[state=active]:text-montessori-primary border-b-2 border-transparent rounded-none px-4 py-3 font-medium text-slate-500 gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:border-montessori-primary data-[state=active]:text-montessori-primary border-b-2 border-transparent rounded-none px-4 py-3 font-medium text-slate-500 gap-2">
            <CreditCard className="w-4 h-4" /> Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium text-slate-900 mb-2">School Profile</h3>
              <p className="text-sm text-slate-500">Basic information about your program that will be displayed to parents.</p>
            </div>
            <div className="md:col-span-2 space-y-6">
              <Card className="border-slate-100 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label>School Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="border-slate-200" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="border-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Campus Address</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} className="border-slate-200" />
                  </div>

                  {school.programs.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-medium text-slate-900 mb-3">Programs Offered</h4>
                      <div className="flex flex-wrap gap-2">
                        {school.programs.map((p) => (
                          <Badge key={p} variant="secondary" className="bg-emerald-100 text-emerald-700 border-none px-3 py-1">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="p-6 pb-0">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4 text-montessori-primary" /> Brand Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Primary", value: primary, set: setPrimary },
                      { label: "Secondary", value: secondary, set: setSecondary },
                      { label: "Accent", value: accent, set: setAccent },
                    ].map((c) => (
                      <div key={c.label} className="space-y-2">
                        <Label>{c.label}</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={c.value}
                            onChange={(e) => c.set(e.target.value)}
                            className="h-10 w-12 rounded border border-slate-200 bg-white p-1"
                          />
                          <Input value={c.value} onChange={(e) => c.set(e.target.value)} className="border-slate-200 font-mono text-xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">Saved colors apply to your whole portal instantly.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium text-slate-900 mb-2">Staff Directory</h3>
              <p className="text-sm text-slate-500">Manage teacher and administrative access to the platform.</p>
            </div>
            <div className="md:col-span-2">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-medium">
                    Active Users
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      {staff.length}
                    </span>
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setIsStaffOpen(true)}
                    className="h-8 gap-2 bg-montessori-primary text-white hover:bg-montessori-primary/90"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Staff
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {staff.length === 0 ? (
                    <div className="p-10 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No staff yet</h3>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Add teachers and administrators. They sign in with a one-time
                        email code — no password needed.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {staff.map((m) => (
                        <li key={m.userId} className="flex items-center gap-4 p-4 group">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-montessori-primary/10 text-montessori-primary font-medium">
                            {(m.name.trim()[0] ?? "?").toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">
                              {m.name}
                              {m.userId === currentUserId && (
                                <span className="ml-2 text-xs font-normal text-slate-400">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{m.email}</p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`border-none capitalize ${
                              m.role === "admin"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {m.role}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`border-none flex items-center gap-1 ${
                              m.status === "active"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {m.status === "active" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {m.status === "active" ? "Active" : "Invited"}
                          </Badge>
                          {m.userId !== currentUserId && (
                            <button
                              onClick={() => handleRemoveStaff(m)}
                              disabled={staffPending}
                              aria-label={`Remove ${m.name}`}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Notification Preferences</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">Configure automated email digests, SMS alerts for emergencies, and daily parent update schedules.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-0">
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Subscription & Billing</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">Manage your platform subscription, view past invoices, and update payment methods.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isStaffOpen} onOpenChange={setIsStaffOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Add a staff member</DialogTitle>
            <DialogDescription>
              Grant a teacher or administrator access. They&apos;ll get an email to
              sign in with a one-time code.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="teacher@example.com"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-name">
                Name <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="staff-name"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Ms. Sarah Reed"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-2">
                {(["teacher", "admin"] as const).map((r) => (
                  <Button
                    key={r}
                    type="button"
                    variant={staffRole === r ? "default" : "outline"}
                    onClick={() => setStaffRole(r)}
                    className={`flex-1 capitalize ${
                      staffRole === r
                        ? "bg-montessori-primary text-white hover:bg-montessori-primary/90"
                        : "text-slate-600"
                    }`}
                  >
                    {r}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                {staffRole === "admin"
                  ? "Admins can manage the whole school, including staff and billing."
                  : "Teachers can manage their own classes, students, and reports."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStaffOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteStaff}
              disabled={staffPending || !staffEmail.trim()}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {staffPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
