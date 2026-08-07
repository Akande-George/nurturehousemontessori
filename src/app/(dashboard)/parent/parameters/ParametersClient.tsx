"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, HeartPulse, Phone, Pill, ShieldAlert, Pencil, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateChildParameters } from "@/lib/actions/students";
import type { Student } from "@/lib/db/types";
import type { Medication } from "@/lib/db/students";

type EmergencyContact = {
  name?: string;
  phone?: string;
  relationship?: string;
};

function readEmergencyContact(value: unknown): EmergencyContact | null {
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    return {
      name: typeof v.name === "string" ? v.name : undefined,
      phone: typeof v.phone === "string" ? v.phone : undefined,
      relationship:
        typeof v.relationship === "string" ? v.relationship : undefined,
    };
  }
  return null;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export function ParametersClient({
  children,
  medicationsByChild,
}: {
  children: Student[];
  medicationsByChild: Record<string, Medication[]>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const effectiveId =
    selectedId && children.some((c) => c.id === selectedId)
      ? selectedId
      : children[0]?.id ?? null;
  const child = effectiveId
    ? children.find((c) => c.id === effectiveId) ?? null
    : null;

  const emergency = child ? readEmergencyContact(child.emergency_contact) : null;
  const medications = child ? medicationsByChild[child.id] ?? [] : [];

  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [allergyText, setAllergyText] = useState("");
  const [notes, setNotes] = useState("");
  const [ecName, setEcName] = useState("");
  const [ecPhone, setEcPhone] = useState("");
  const [ecRel, setEcRel] = useState("");

  const openEdit = () => {
    if (!child) return;
    const ec = readEmergencyContact(child.emergency_contact);
    setAllergyText(child.allergies.join(", "));
    setNotes(child.medical_notes ?? "");
    setEcName(ec?.name ?? "");
    setEcPhone(ec?.phone ?? "");
    setEcRel(ec?.relationship ?? "");
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!child) return;
    const parsedAllergies = allergyText
      .split(/[,\n]/)
      .map((a) => a.trim())
      .filter(Boolean);
    start(async () => {
      const res = await updateChildParameters({
        studentId: child.id,
        allergies: parsedAllergies,
        medicalNotes: notes,
        emergencyContact: { name: ecName, phone: ecPhone, relationship: ecRel },
      });
      if (res.ok) {
        setEditOpen(false);
        toast({ title: "Details updated", description: `${child.name.split(" ")[0]}'s parameters were saved.` });
      } else {
        toast({ title: res.error ?? "Failed to save", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">Child Parameters</h1>
        <p className="text-sm text-slate-500 mt-1">
          Allergies, medical notes, and emergency contacts on record for your
          children.
        </p>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                effectiveId === c.id
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {!child ? (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            No children are linked to your account yet.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${child.avatar_color} text-white flex items-center justify-center font-bold text-sm shrink-0`}
              >
                {initials(child.name)}
              </div>
              <div>
                <CardTitle className="text-base">{child.name}</CardTitle>
                <p className="text-xs text-slate-500">{child.classroom ?? ""}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openEdit}
                className="ml-auto gap-2"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Allergies */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Allergies
              </p>
              {child.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {child.allergies.map((allergy) => (
                    <Badge
                      key={allergy}
                      variant="outline"
                      className="bg-rose-50 border-rose-200 text-rose-700"
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">None on record.</p>
              )}
            </div>

            {/* Medical notes */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5" /> Medical Notes
              </p>
              {child.medical_notes ? (
                <p className="text-sm text-slate-700">{child.medical_notes}</p>
              ) : (
                <p className="text-sm text-slate-400">None on record.</p>
              )}
            </div>

            {/* Medications (read-only) */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" /> Medications
              </p>
              {medications.length > 0 ? (
                <ul className="space-y-2">
                  {medications.map((m) => (
                    <li
                      key={m.id}
                      className="rounded-lg border border-slate-100 px-4 py-3"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {m.name}
                        {m.dosage && (
                          <span className="text-slate-500 font-normal ml-1.5">
                            · {m.dosage}
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-slate-500">
                        {m.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {m.time}
                          </span>
                        )}
                        {m.notes && <span>{m.notes}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">None on record.</p>
              )}
            </div>

            {/* Emergency contact */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Emergency Contact
              </p>
              {emergency && (emergency.name || emergency.phone) ? (
                <div className="rounded-lg border border-slate-100 p-4 space-y-1">
                  {emergency.name && (
                    <p className="text-sm font-medium text-slate-900">
                      {emergency.name}
                      {emergency.relationship && (
                        <span className="text-slate-500 font-normal ml-1.5 text-xs">
                          ({emergency.relationship})
                        </span>
                      )}
                    </p>
                  )}
                  {emergency.phone && (
                    <p className="text-sm text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> {emergency.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">None on record.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit parameters (parent-owned: allergies, notes, emergency contact) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit {child?.name.split(" ")[0]}&apos;s parameters</DialogTitle>
            <DialogDescription>
              Keep allergies, medical notes, and your emergency contact up to date.
              Your child&apos;s teachers can see these.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="p-allergies" className="text-sm font-medium text-slate-700">
                Allergies
              </label>
              <Input
                id="p-allergies"
                value={allergyText}
                onChange={(e) => setAllergyText(e.target.value)}
                placeholder="e.g. Peanuts, Dairy"
                className="border-slate-200"
              />
              <p className="text-xs text-slate-400">Separate multiple with commas.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="p-notes" className="text-sm font-medium text-slate-700">
                Medical notes
              </label>
              <Textarea
                id="p-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any conditions or care instructions the school should know…"
                className="min-h-24 border-slate-200"
              />
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mt-3 mb-3">
                Emergency contact
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="p-ec-name" className="text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <Input id="p-ec-name" value={ecName} onChange={(e) => setEcName(e.target.value)} className="border-slate-200" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="p-ec-rel" className="text-sm font-medium text-slate-700">
                    Relationship
                  </label>
                  <Input id="p-ec-rel" value={ecRel} onChange={(e) => setEcRel(e.target.value)} placeholder="e.g. Mother" className="border-slate-200" />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <label htmlFor="p-ec-phone" className="text-sm font-medium text-slate-700">
                  Phone
                </label>
                <Input id="p-ec-phone" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} placeholder="+234 …" className="border-slate-200" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={pending}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
