"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, HeartPulse, Phone, Pill, ShieldAlert } from "lucide-react";
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
    </div>
  );
}
