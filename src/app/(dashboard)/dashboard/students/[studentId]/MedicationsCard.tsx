"use client";

import { useState, useTransition } from "react";
import { Pill, Plus, Trash2, Clock } from "lucide-react";
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
import { addMedication, removeMedication } from "@/lib/actions/students";
import type { Medication } from "@/lib/db/students";

export function MedicationsCard({
  studentId,
  medications,
}: {
  studentId: string;
  medications: Medication[];
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const add = () => {
    if (!name.trim()) {
      toast({ title: "Add a medication name", variant: "destructive" });
      return;
    }
    start(async () => {
      const res = await addMedication({
        studentId,
        name: name.trim(),
        dosage: dosage.trim() || undefined,
        time: time.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (res.ok) {
        setName("");
        setDosage("");
        setTime("");
        setNotes("");
        toast({ title: "Medication added" });
      } else {
        toast({ title: res.error ?? "Failed", variant: "destructive" });
      }
    });
  };

  const remove = (id: string) => {
    start(async () => {
      const res = await removeMedication(id, studentId);
      if (res.ok) toast({ title: "Medication removed" });
      else toast({ title: res.error ?? "Failed", variant: "destructive" });
    });
  };

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Pill className="w-4 h-4 text-montessori-primary" /> Medications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {medications.length > 0 ? (
          <ul className="space-y-2">
            {medications.map((m) => (
              <li
                key={m.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
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
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  onClick={() => remove(m.id)}
                  className="text-slate-400 hover:text-rose-600 shrink-0"
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No medications on record.</p>
        )}

        <div className="rounded-lg border border-dashed border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ventolin inhaler"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dosage</Label>
              <Input
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 2 puffs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time</Label>
              <Input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. After lunch"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <Button
            onClick={add}
            disabled={pending}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90 gap-2"
          >
            <Plus className="w-4 h-4" /> Add medication
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
