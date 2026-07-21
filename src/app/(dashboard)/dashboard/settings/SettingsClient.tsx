"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Bell,
  Shield,
  Users,
  CreditCard,
  Save,
  Palette,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateSchoolBranding } from "@/lib/actions/schools";
import { readTheme, type School } from "@/lib/db/types";

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

export function SettingsClient({ school }: { school: School }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const theme = readTheme(school.theme);

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
                  <CardTitle className="text-base font-medium">Active Users</CardTitle>
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    <Shield className="w-3 h-3" /> Invite User
                  </Button>
                </CardHeader>
                <CardContent className="p-10 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Team management</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">Invite teachers and administrators, assign roles, and manage platform access. Coming soon.</p>
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
    </div>
  );
}
