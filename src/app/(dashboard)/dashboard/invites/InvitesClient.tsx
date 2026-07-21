"use client";

import { useMemo, useState, useTransition } from "react";
import { Mail, CheckCircle2, Clock, KeyRound, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { inviteParent, resendParentInvite } from "@/lib/actions/invites";
import type { PortalRow, PortalStatus } from "@/lib/db/invites";

const STATUS_STYLE: Record<
  PortalStatus,
  { label: string; bg: string; icon: typeof CheckCircle2 }
> = {
  active: {
    label: "Active",
    bg: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80",
    icon: CheckCircle2,
  },
  invited: {
    label: "Invited",
    bg: "bg-amber-100 text-amber-700 hover:bg-amber-100/80",
    icon: Clock,
  },
  pending: {
    label: "Pending",
    bg: "bg-slate-100 text-slate-700 hover:bg-slate-100/80",
    icon: Mail,
  },
};

export function InvitesClient({
  roster,
  students,
  loginUrl,
}: {
  roster: PortalRow[];
  students: { id: string; name: string }[];
  loginUrl: string;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [parentName, setParentName] = useState("");
  const [studentId, setStudentId] = useState("");

  const stats = useMemo(() => {
    const active = roster.filter((r) => r.status === "active").length;
    const invited = roster.filter((r) => r.status !== "active").length;
    return { active, invited, total: roster.length };
  }, [roster]);

  const resetForm = () => {
    setEmail("");
    setParentName("");
    setStudentId("");
  };

  const handleInvite = () => {
    if (!email.trim() || !studentId) return;
    const payload = { email: email.trim(), studentId, parentName: parentName.trim() || undefined };
    startTransition(async () => {
      const res = await inviteParent(payload);
      if (!res.ok) {
        toast({ title: "Could not send invite", description: res.error, variant: "destructive" });
        return;
      }
      resetForm();
      setIsOpen(false);
      toast({ title: "Invitation sent", description: `${payload.email} can now sign in to the portal.` });
    });
  };

  const handleResend = (row: PortalRow) => {
    startTransition(async () => {
      const res = await resendParentInvite(row.email);
      if (!res.ok) {
        toast({ title: "Could not resend", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "Invite resent", description: `A new sign-in link was emailed to ${row.email}.` });
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      toast({ title: "Link copied", description: "Portal sign-in link copied to your clipboard." });
    } catch {
      toast({ title: "Copy failed", description: loginUrl });
    }
  };

  const metrics = [
    { label: "Active Portals", value: stats.active, trend: "Signed in", color: "bg-emerald-100 text-emerald-700" },
    { label: "Awaiting Sign-in", value: stats.invited, trend: "Invited", color: "bg-amber-100 text-amber-700" },
    { label: "Total Families", value: stats.total, trend: "With access", color: "bg-blue-100 text-blue-700" },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900 mb-1">Parent Portal Activation</h1>
          <p className="text-sm text-slate-500">Manage account access and invitations for enrolled families.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-medium" onClick={handleCopyLink}>
            Copy Portal Link
          </Button>
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2"
          >
            <UserPlus className="w-4 h-4" /> Invite Parent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, i) => (
          <Card key={i} className="hover-lift transition-all border-slate-100 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-serif text-slate-900">{metric.value}</h3>
                  <span className="text-xs font-medium text-slate-400">{metric.trend}</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${metric.color}`}>
                <KeyRound className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-montessori-earth/10 border-montessori-earth/20 shadow-none">
          <CardContent className="p-5">
            <h3 className="font-serif font-medium text-slate-900 mb-2">How it works</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Inviting a parent creates their portal account and links them to their child. They sign
              in with a one-time email code — no password needed.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Activation Status</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Parent</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Children</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Email Address</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Portal Status</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-slate-500">Last Action</TableHead>
                <TableHead className="font-medium text-right text-xs uppercase tracking-wider text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-16 text-sm text-slate-500">
                    No families have portal access yet. Use “Invite Parent” to get started.
                  </TableCell>
                </TableRow>
              ) : (
                roster.map((row) => {
                  const s = STATUS_STYLE[row.status];
                  const Icon = s.icon;
                  return (
                    <TableRow key={row.key} className="hover:bg-slate-50 transition-colors group">
                      <TableCell className="font-medium text-slate-900">{row.parentName}</TableCell>
                      <TableCell className="text-slate-600">
                        {row.students.length ? row.students.join(", ") : "—"}
                      </TableCell>
                      <TableCell className="text-slate-500">{row.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${s.bg} font-medium border-none flex items-center gap-1.5 w-max`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {s.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{row.lastAction}</TableCell>
                      <TableCell className="text-right">
                        {row.status !== "active" && row.email && (
                          <Button
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleResend(row)}
                            className="text-montessori-primary hover:text-montessori-primary/80 hover:bg-montessori-primary/5 opacity-0 group-hover:opacity-100 transition-all font-medium h-8 px-3"
                          >
                            Resend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Invite a parent</DialogTitle>
            <DialogDescription>
              Create portal access for a family and email them a sign-in link.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="inv-email" className="text-sm font-medium text-slate-700">
                Parent email
              </label>
              <Input
                id="inv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="inv-name" className="text-sm font-medium text-slate-700">
                Parent name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <Input
                id="inv-name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. Amanda Wong"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Link to child</label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">No students yet</div>
                  ) : (
                    students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={isPending || !email.trim() || !studentId}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
