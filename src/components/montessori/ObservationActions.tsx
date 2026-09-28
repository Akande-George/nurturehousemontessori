"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CurriculumLeafFields,
  useCurriculumLeaf,
} from "@/components/montessori/CurriculumLeafPicker";
import { deleteObservation, updateObservation } from "@/lib/actions/montessori";
import { useToast } from "@/hooks/use-toast";
import type { Area } from "@/lib/curriculum/curriculum";

type EditableObservation = { id: string; leaf_id: string; content: string };

// Edit / Delete controls for one observation. The server re-checks that the
// caller wrote it (or is an admin); callers only render this for those rows.
export function ObservationActions({
  observation,
  catalog,
}: {
  observation: EditableObservation;
  catalog: Area[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  const handleDelete = () => {
    if (!window.confirm("Delete this observation? This can't be undone.")) return;
    start(async () => {
      const res = await deleteObservation(observation.id);
      if (res.ok) {
        toast({ title: "Observation deleted" });
        router.refresh();
      } else {
        toast({ title: res.error ?? "Failed to delete", variant: "destructive" });
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-slate-500 hover:text-slate-900"
          onClick={() => setEditing(true)}
          disabled={pending}
          aria-label="Edit observation"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-slate-500 hover:text-red-600"
          onClick={handleDelete}
          disabled={pending}
          aria-label="Delete observation"
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      </div>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Edit observation</DialogTitle>
            <DialogDescription>Change the note or the activity it&apos;s filed under.</DialogDescription>
          </DialogHeader>
          {/* Mounted only while open so the picker starts from the saved leaf each time. */}
          {editing && (
            <EditObservationForm
              observation={observation}
              catalog={catalog}
              onDone={() => setEditing(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditObservationForm({
  observation,
  catalog,
  onDone,
}: {
  observation: EditableObservation;
  catalog: Area[];
  onDone: () => void;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const picker = useCurriculumLeaf(catalog, observation.leaf_id);
  const [content, setContent] = useState(observation.content);
  const [pending, start] = useTransition();

  const handleSave = () => {
    start(async () => {
      const res = await updateObservation({
        id: observation.id,
        leafId: picker.leafId,
        content,
      });
      if (res.ok) {
        toast({ title: "Observation updated" });
        onDone();
        router.refresh();
      } else {
        toast({ title: res.error ?? "Failed to save", variant: "destructive" });
      }
    });
  };

  return (
    <>
      <div className="space-y-4 py-2">
        <CurriculumLeafFields picker={picker} />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Observation</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-28 border-slate-200 focus-visible:ring-montessori-primary"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={pending || !content.trim() || !picker.leafId}
          className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
        >
          {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </>
  );
}
