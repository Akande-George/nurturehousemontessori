"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addMedication,
  removeMedication,
  getRoleUser,
  getStudentsForParent,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { Pill, Plus, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ParametersPage() {
  const store = useDemoStore();
  const parent = getRoleUser("parent");
  const children = getStudentsForParent(parent.id);
  const { toast } = useToast();

  const [dialog, setDialog] = useState<{
    open: boolean;
    studentId: string;
    name: string;
  }>({ open: false, studentId: "", name: "" });

  const [form, setForm] = useState({
    name: "",
    dosage: "",
    time: "",
    notes: "",
  });

  const resetForm = () =>
    setForm({ name: "", dosage: "", time: "", notes: "" });

  const handleOpen = (studentId: string, name: string) => {
    resetForm();
    setDialog({ open: true, studentId, name });
  };

  const handleAdd = () => {
    if (!form.name.trim() || !form.dosage.trim() || !form.time.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in name, dosage and time.",
      });
      return;
    }
    addMedication(dialog.studentId, {
      name: form.name.trim(),
      dosage: form.dosage.trim(),
      time: form.time.trim(),
      notes: form.notes.trim(),
    });
    setDialog({ open: false, studentId: "", name: "" });
    toast({
      title: "Medication added",
      description: `Medication schedule saved for ${dialog.name.split(" ")[0]}.`,
    });
  };

  const handleRemove = (
    studentId: string,
    medicationId: string,
    medName: string,
  ) => {
    removeMedication(studentId, medicationId);
    toast({
      title: "Medication removed",
      description: `${medName} removed from the schedule.`,
    });
  };

  // Re-read after mutations
  const updatedChildren = getStudentsForParent(parent.id);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">Child Parameters</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage medical notes and medication schedules for your children.
        </p>
      </div>

      <div className="space-y-6">
        {updatedChildren.map((child) => (
          <Card key={child.id} className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${child.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0`}
                >
                  {child.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <CardTitle className="text-base">{child.name}</CardTitle>
                  <p className="text-xs text-slate-500">
                    {child.classroom} · {child.ageGroup}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Allergies */}
              {child.allergies.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Allergies
                  </p>
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
                </div>
              )}

              {/* Medical notes */}
              {child.medicalNotes && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Medical Notes
                  </p>
                  <p className="text-sm text-slate-700">{child.medicalNotes}</p>
                </div>
              )}

              {/* Medications */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Medication Schedule
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpen(child.id, child.name)}
                    className="text-montessori-primary border-montessori-primary/30 hover:bg-montessori-primary/5 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Medication
                  </Button>
                </div>

                {child.medications.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 p-4">
                    <Pill className="w-4 h-4 text-slate-300 shrink-0" />
                    <p className="text-sm text-slate-400">
                      No medications on record.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {child.medications.map((med) => (
                      <div
                        key={med.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                      >
                        <Pill className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {med.name}
                            <span className="text-slate-500 font-normal ml-1.5 text-xs">
                              {med.dosage}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {med.time}
                            {med.notes && (
                              <span className="ml-1">· {med.notes}</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleRemove(child.id, med.id, med.name)
                          }
                          className="text-slate-300 hover:text-rose-400 transition-colors p-1"
                          aria-label="Remove medication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add medication dialog */}
      <Dialog
        open={dialog.open}
        onOpenChange={(v) =>
          !v && setDialog({ open: false, studentId: "", name: "" })
        }
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              Add Medication for {dialog.name.split(" ")[0]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Medication name</Label>
              <Input
                placeholder="e.g. Cetirizine"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dosage</Label>
              <Input
                placeholder="e.g. 5ml or 1 tablet"
                value={form.dosage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dosage: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input
                placeholder="e.g. 08:00 AM or After lunch"
                value={form.time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, time: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any special instructions…"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDialog({ open: false, studentId: "", name: "" })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              Save Medication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
