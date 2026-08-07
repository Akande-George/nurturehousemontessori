"use client";

import { useState, useTransition } from "react";
import { Pencil, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { updateStudentParameters } from "@/lib/actions/students";

type Emergency = { name?: string; phone?: string; relationship?: string };

export function EditParametersButton({
  studentId,
  studentName,
  allergies,
  medicalNotes,
  emergency,
}: {
  studentId: string;
  studentName: string;
  allergies: string[];
  medicalNotes: string | null;
  emergency: Emergency | null;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const [allergyText, setAllergyText] = useState(allergies.join(", "));
  const [notes, setNotes] = useState(medicalNotes ?? "");
  const [ecName, setEcName] = useState(emergency?.name ?? "");
  const [ecPhone, setEcPhone] = useState(emergency?.phone ?? "");
  const [ecRel, setEcRel] = useState(emergency?.relationship ?? "");

  const handleSave = () => {
    const parsedAllergies = allergyText
      .split(/[,\n]/)
      .map((a) => a.trim())
      .filter(Boolean);
    start(async () => {
      const res = await updateStudentParameters({
        studentId,
        allergies: parsedAllergies,
        medicalNotes: notes,
        emergencyContact: { name: ecName, phone: ecPhone, relationship: ecRel },
      });
      if (res.ok) {
        setOpen(false);
        toast({ title: "Parameters updated", description: `${studentName}'s details were saved.` });
      } else {
        toast({ title: res.error ?? "Failed to save", variant: "destructive" });
      }
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Pencil className="w-3.5 h-3.5" /> Edit parameters
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit child parameters</DialogTitle>
            <DialogDescription>
              Allergies, medical notes, and emergency contact for {studentName}.
              Parents can view these in their portal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="allergies" className="text-sm font-medium text-slate-700">
                Allergies
              </label>
              <Input
                id="allergies"
                value={allergyText}
                onChange={(e) => setAllergyText(e.target.value)}
                placeholder="e.g. Peanuts, Dairy"
                className="border-slate-200"
              />
              <p className="text-xs text-slate-400">Separate multiple with commas.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-slate-700">
                Medical notes
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any conditions, medication guidance, or care instructions…"
                className="min-h-24 border-slate-200"
              />
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mt-3 mb-3">
                Emergency contact
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="ec-name" className="text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <Input id="ec-name" value={ecName} onChange={(e) => setEcName(e.target.value)} className="border-slate-200" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ec-rel" className="text-sm font-medium text-slate-700">
                    Relationship
                  </label>
                  <Input id="ec-rel" value={ecRel} onChange={(e) => setEcRel(e.target.value)} placeholder="e.g. Mother" className="border-slate-200" />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <label htmlFor="ec-phone" className="text-sm font-medium text-slate-700">
                  Phone
                </label>
                <Input id="ec-phone" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} placeholder="+234 …" className="border-slate-200" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
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
    </>
  );
}
