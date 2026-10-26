"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { recordCurriculumWork } from "@/lib/actions/montessori";
import { uploadActivityImage } from "@/lib/actions/media";
import { isGeneralLeafId, type Area } from "@/lib/curriculum/curriculum";
import type { ProgressMap } from "@/lib/curriculum/progress-utils";
import type { CurriculumStatus } from "@/lib/db/types";
import {
  CurriculumLeafFields,
  useCurriculumLeaf,
} from "./CurriculumLeafPicker";

/** Photos go to the action as a base64 data URL, so keep them modest. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const STATUS_OPTIONS: { value: CurriculumStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "introduced", label: "Introduced" },
  { value: "developing", label: "Developing" },
  { value: "proficient", label: "Proficient" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.readAsDataURL(file);
  });
}

/**
 * One form for everything a teacher records about a moment of work: the level,
 * the practice, the observation and the photo that goes home.
 *
 * Those used to be three screens — the record book, the journal and the
 * activity feed — each asking again which child and which lesson. They all
 * describe the same event, so here they share one lesson picker and one save.
 * Every field below the lesson is optional.
 */
export function RecordWorkDialog({
  open,
  onOpenChange,
  student,
  catalog,
  progress,
  initialLeafId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: { id: string; name: string };
  /** The school's FULL catalog, so hidden and custom lessons still resolve. */
  catalog: Area[];
  progress: ProgressMap;
  initialLeafId?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const picker = useCurriculumLeaf(catalog, initialLeafId);
  const leafId = picker.leafId;
  const isGeneral = !leafId || isGeneralLeafId(leafId);
  const currentStatus: CurriculumStatus = progress[leafId]?.status ?? "not_started";

  // Keyed by leaf so changing lesson mid-form doesn't carry the level over to
  // a lesson the teacher never looked at.
  const [picked, setPicked] = useState<{
    leafId: string;
    status: CurriculumStatus;
  } | null>(null);
  const status =
    picked && picked.leafId === leafId ? picked.status : currentStatus;
  const statusChanged = status !== currentStatus;

  const [logPractice, setLogPractice] = useState(true);
  const [practiceDate, setPracticeDate] = useState(todayIso);
  const [observation, setObservation] = useState("");
  const [caption, setCaption] = useState("");
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(
    null,
  );

  const firstName = student.name.split(" ")[0] || student.name;

  const clearPhoto = () => {
    setPhoto(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handlePhoto = (file: File | null) => {
    if (!file) return clearPhoto();
    if (!file.type.startsWith("image/")) {
      toast({ title: "Choose an image file", variant: "destructive" });
      clearPhoto();
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast({
        title: "That photo is too large",
        description: "Photos need to be under 8 MB.",
        variant: "destructive",
      });
      clearPhoto();
      return;
    }
    setPhoto({ file, preview: URL.createObjectURL(file) });
  };

  const nothingToSave =
    !statusChanged &&
    (isGeneral || !logPractice) &&
    !observation.trim() &&
    !photo;

  const handleSave = () => {
    if (!leafId) {
      toast({ title: "Choose a curriculum activity", variant: "destructive" });
      return;
    }
    start(async () => {
      let imageUrl = "";
      if (photo) {
        let dataUrl: string;
        try {
          dataUrl = await fileToDataUrl(photo.file);
        } catch {
          toast({ title: "Could not read that photo", variant: "destructive" });
          return;
        }
        const up = await uploadActivityImage(dataUrl);
        if (up.error || !up.url) {
          toast({
            title: up.error ?? "Photo upload failed",
            variant: "destructive",
          });
          return;
        }
        imageUrl = up.url;
      }

      const res = await recordCurriculumWork({
        studentId: student.id,
        leafId,
        status: statusChanged ? status : undefined,
        practiceDate: !isGeneral && logPractice ? practiceDate : undefined,
        observation: observation.trim() || undefined,
        imageUrl: imageUrl || undefined,
        caption: caption.trim() || undefined,
      });

      if (!res.ok) {
        toast({ title: res.error ?? "Could not record", variant: "destructive" });
        return;
      }

      const parts = res.recorded ?? [];
      toast({
        title: `Recorded for ${firstName}`,
        description:
          parts.length > 0
            ? `Saved: ${parts.join(", ")}.`
            : "Saved.",
      });

      // Reset everything except the lesson — logging two things against the
      // same lesson in a row is common.
      setPicked(null);
      setObservation("");
      setCaption("");
      clearPhoto();
      setLogPractice(true);
      setPracticeDate(todayIso());
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Record work for {firstName}</DialogTitle>
          <DialogDescription>
            Level, practice, observation and a photo for home — whatever
            happened, in one go. Everything below the lesson is optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <CurriculumLeafFields picker={picker} />

          {isGeneral ? (
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              This is a general note for the whole area, so it carries no level
              or practice. Pick a specific activity above if you want to record
              those too.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Level
                </label>
                <Select
                  value={status}
                  onValueChange={(v) =>
                    setPicked({ leafId, status: v as CurriculumStatus })
                  }
                >
                  <SelectTrigger className="border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  {statusChanged
                    ? `Changing from ${
                        STATUS_OPTIONS.find((o) => o.value === currentStatus)
                          ?.label ?? currentStatus
                      }.`
                    : "Unchanged — leave as is if the level hasn't moved."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Practice
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <Checkbox
                    checked={logPractice}
                    onCheckedChange={(v) => setLogPractice(v === true)}
                  />
                  Record a practice
                </label>
                <input
                  type="date"
                  value={practiceDate}
                  disabled={!logPractice}
                  onChange={(e) => setPracticeDate(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-montessori-primary/20 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="record-observation"
              className="block text-sm font-medium text-slate-700"
            >
              Observation
            </label>
            <Textarea
              id="record-observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder={`What you saw ${firstName} do — concentration, repetition, what they chose next.`}
              className="min-h-24 border-slate-200 focus-visible:ring-montessori-primary"
            />
            <p className="text-xs text-slate-400">
              Goes to {firstName}&apos;s journal and onto their progress report.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Photo for the family
            </label>
            {photo ? (
              <div className="flex items-start gap-3">
                <img
                  src={photo.preview}
                  alt="Selected"
                  className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="A line for the activity feed…"
                    className="min-h-16 border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" /> Remove photo
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500 hover:border-slate-300">
                <Camera className="h-4 w-4" />
                Add a photo
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-xs text-slate-400">
              Posts to the activity feed {firstName}&apos;s parents see.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={pending || nothingToSave}
            className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
