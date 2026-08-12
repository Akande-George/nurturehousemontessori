"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Loader2,
  RefreshCw,
  Send,
  Star,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  publishConferenceReport,
  regenerateConferenceSnapshot,
  unpublishConferenceReport,
  updateConferenceReport,
} from "@/lib/actions/conference";
import { CHARACTER_TRAITS, RATING_LABELS } from "@/lib/montessori/character";
import {
  DEV_LEVELS,
  DEVELOPMENT_SECTIONS,
  devKey,
  type DevLevel,
} from "@/lib/montessori/development";
import {
  PROFICIENCY_HIGHLIGHT,
  PROFICIENCY_LABELS,
  SECTION_LABELS,
  TERM_LABELS,
  formatReportDate,
  type ConferenceNarrative,
  type ConferenceSections,
  type ConferenceSnapshot,
} from "@/lib/montessori/conference";
import { ProgressReportDocument } from "@/components/montessori/ProgressReportDocument";
import { AreaHeading } from "@/components/montessori/ProgressReportSections";
import type { ConferenceReportStatus } from "@/lib/db/types";

const toLines = (s: string) =>
  s.split("\n").map((l) => l.trim()).filter(Boolean);

function StarRow({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5 transition-transform hover:scale-110 disabled:hover:scale-100"
        >
          <Star
            className={`h-5 w-5 ${
              n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 w-24 text-xs text-slate-400">
        {value ? RATING_LABELS[value] : "Not rated"}
      </span>
    </div>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      {hint && <p className="mb-3 mt-0.5 text-sm text-slate-500">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

export function ProgressReportEditorClient({
  id,
  title: initialTitle,
  status,
  snapshot,
  narrative: initialNarrative,
  sections: initialSections,
}: {
  id: string;
  title: string;
  status: ConferenceReportStatus;
  snapshot: ConferenceSnapshot;
  narrative: ConferenceNarrative;
  sections: ConferenceSections;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState(false);

  const published = status === "published";
  const [title, setTitle] = useState(initialTitle);
  const [narrative, setNarrative] = useState(initialNarrative);
  const [sections, setSections] = useState(initialSections);
  const [strengthsText, setStrengthsText] = useState(
    initialNarrative.strengths.join("\n"),
  );
  const [growthText, setGrowthText] = useState(
    initialNarrative.areasForGrowth.join("\n"),
  );

  const patch = (p: Partial<ConferenceNarrative>) =>
    setNarrative((prev) => ({ ...prev, ...p }));

  const currentNarrative = (): ConferenceNarrative => ({
    ...narrative,
    strengths: toLines(strengthsText),
    areasForGrowth: toLines(growthText),
  });

  const handleSave = () =>
    start(async () => {
      const res = await updateConferenceReport({
        id,
        title,
        sections,
        narrative: currentNarrative(),
      });
      toast(
        res.ok
          ? { title: "Saved" }
          : { title: res.error ?? "Could not save", variant: "destructive" },
      );
      if (res.ok) router.refresh();
    });

  const handleRegenerate = () =>
    start(async () => {
      const res = await regenerateConferenceSnapshot(id);
      toast(
        res.ok
          ? {
              title: "Refreshed",
              description:
                "Lessons, notes, photos and attendance re-collected. Your writing is untouched.",
            }
          : { title: res.error ?? "Could not refresh", variant: "destructive" },
      );
      if (res.ok) router.refresh();
    });

  const handlePublish = () =>
    start(async () => {
      // Persist edits first — publishing freezes the document.
      const saved = await updateConferenceReport({
        id,
        title,
        sections,
        narrative: currentNarrative(),
      });
      if (!saved.ok) {
        toast({ title: saved.error ?? "Could not save", variant: "destructive" });
        return;
      }
      const res = await publishConferenceReport(id);
      toast(
        res.ok
          ? {
              title: "Published",
              description: "Parents can now read and download this report.",
            }
          : { title: res.error ?? "Could not publish", variant: "destructive" },
      );
      if (res.ok) router.refresh();
    });

  const handleUnpublish = () =>
    start(async () => {
      const res = await unpublishConferenceReport(id);
      toast(
        res.ok
          ? { title: "Moved back to draft" }
          : { title: res.error ?? "Could not unpublish", variant: "destructive" },
      );
      if (res.ok) router.refresh();
    });

  const h = snapshot.header;

  return (
    <div className="mx-auto max-w-4xl pb-24">
      {/* ---- Chrome (never part of the printed document) ----------------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/teacher/reports/progress">
            <ArrowLeft className="h-4 w-4" /> All reports
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={
              published
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }
          >
            {published ? "Published" : "Draft"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreview((p) => !p)}
            className="gap-1.5"
          >
            <Eye className="h-4 w-4" /> {preview ? "Edit" : "Preview"}
          </Button>
          {published ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              disabled={pending}
              className="gap-1.5"
            >
              <Undo2 className="h-4 w-4" /> Unpublish
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={pending}
                className="gap-1.5"
              >
                <RefreshCw className="h-4 w-4" /> Refresh data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={pending}
              >
                {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={pending}
                className="gap-1.5 bg-montessori-primary text-white hover:bg-montessori-primary/90"
              >
                <Send className="h-4 w-4" /> Publish
              </Button>
            </>
          )}
        </div>
      </div>

      {published && (
        <p className="mb-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 print:hidden">
          This report is published and locked. Unpublish it to make changes —
          parents will lose access until you publish again.
        </p>
      )}

      {preview || published ? (
        <ProgressReportDocument
          title={title}
          snapshot={snapshot}
          narrative={currentNarrative()}
          sections={sections}
        />
      ) : (
        <div className="space-y-5">
          {/* ---- Title + who it's for ---------------------------------- */}
          <Card title="Report" hint={`${h.childName} · ${TERM_LABELS[h.term]} · ${h.academicYear}`}>
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-slate-200"
              />
              <p className="text-xs text-slate-400">
                Marking period {formatReportDate(h.periodStart)} –{" "}
                {formatReportDate(h.periodEnd)} · Attendance{" "}
                {snapshot.attendance.period.present} present,{" "}
                {snapshot.attendance.period.absent} absent,{" "}
                {snapshot.attendance.period.tardy} tardy,{" "}
                {snapshot.attendance.period.excused} excused
              </p>
            </div>
          </Card>

          {/* ---- Sections --------------------------------------------- */}
          <Card
            title="Sections"
            hint="Untick anything you don't want on this child's report."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SECTION_LABELS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
                >
                  <Checkbox
                    checked={sections[key]}
                    onCheckedChange={(v) =>
                      setSections((prev) => ({ ...prev, [key]: v === true }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </Card>

          {/* ---- Lessons + per-area comment ---------------------------- */}
          {sections.lessons &&
            snapshot.areas.map((area) => (
              <section
                key={area.areaId}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <AreaHeading
                  name={area.areaName}
                  description={area.areaDescription}
                />
                {area.subcategories.length === 0 ? (
                  <p className="text-sm italic text-slate-400">
                    No lessons recorded for this period.
                  </p>
                ) : (
                  area.subcategories.map((sub) => (
                    <div key={sub.subcategoryId} className="mb-4">
                      <h3 className="text-base text-slate-600">
                        {sub.subcategoryName}
                      </h3>
                      <ul className="mt-1">
                        {sub.lessons.map((lesson) => {
                          const chip = PROFICIENCY_HIGHLIGHT[lesson.level];
                          return (
                            <li
                              key={lesson.leafId}
                              className="flex items-baseline gap-2 py-[3px] pl-4 text-sm"
                            >
                              <span className="text-slate-600">
                                {lesson.leafName}
                              </span>
                              <span className="min-w-4 flex-1 border-b border-dotted border-slate-200" />
                              <span
                                className={
                                  chip
                                    ? `rounded px-1.5 py-0.5 text-xs font-medium ${chip}`
                                    : "text-xs text-slate-500"
                                }
                              >
                                {PROFICIENCY_LABELS[lesson.level]}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                )}
                <Textarea
                  value={narrative.areaComments[area.areaId] ?? ""}
                  onChange={(e) =>
                    patch({
                      areaComments: {
                        ...narrative.areaComments,
                        [area.areaId]: e.target.value,
                      },
                    })
                  }
                  placeholder={`Your summary of ${h.childName.split(" ")[0]}'s work in ${area.areaName}…`}
                  className="mt-2 min-h-24 border-slate-200 focus-visible:ring-montessori-primary"
                />
              </section>
            ))}

          {/* ---- Developmental checklists ------------------------------ */}
          {sections.development &&
            DEVELOPMENT_SECTIONS.map((section) => (
              <Card key={section.id} title={section.title}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-300">
                        {DEV_LEVELS.map((level) => (
                          <th
                            key={level.key}
                            className="w-24 py-1.5 text-left text-xs font-semibold text-slate-700"
                          >
                            {level.label}
                          </th>
                        ))}
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item) => {
                        const key = devKey(section.id, item.id);
                        const value = narrative.development[key] ?? null;
                        return (
                          <tr key={item.id} className="border-b border-slate-100">
                            {DEV_LEVELS.map((level) => (
                              <td key={level.key} className="py-1.5">
                                <input
                                  type="radio"
                                  name={key}
                                  checked={value === level.key}
                                  aria-label={`${item.label}: ${level.label}`}
                                  onChange={() =>
                                    patch({
                                      development: {
                                        ...narrative.development,
                                        [key]: level.key as DevLevel,
                                      },
                                    })
                                  }
                                  className="h-4 w-4 accent-montessori-primary"
                                />
                              </td>
                            ))}
                            <td className="py-1.5 text-slate-600">
                              {item.label}
                              {value && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    patch({
                                      development: {
                                        ...narrative.development,
                                        [key]: null,
                                      },
                                    })
                                  }
                                  className="ml-2 text-xs text-slate-400 hover:text-slate-600"
                                >
                                  clear
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Textarea
                  value={narrative.developmentComments[section.id] ?? ""}
                  onChange={(e) =>
                    patch({
                      developmentComments: {
                        ...narrative.developmentComments,
                        [section.id]: e.target.value,
                      },
                    })
                  }
                  placeholder="Comments…"
                  className="mt-3 min-h-20 border-slate-200 focus-visible:ring-montessori-primary"
                />
              </Card>
            ))}

          {/* ---- Character profile ------------------------------------- */}
          {sections.character && (
            <Card
              title="Character profile"
              hint="Rate each trait from 1 to 5 stars. Unrated traits are left off the report."
            >
              <div className="divide-y divide-slate-100">
                {CHARACTER_TRAITS.map((trait) => (
                  <div
                    key={trait}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-800">
                      {trait}
                    </span>
                    <StarRow
                      value={narrative.character[trait] ?? 0}
                      onChange={(v) =>
                        patch({
                          character: { ...narrative.character, [trait]: v },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ---- Notes ------------------------------------------------- */}
          {sections.notes && (
            <Card
              title="Observation notes"
              hint={
                snapshot.notes.length === 0
                  ? "No observations were logged in this period."
                  : "Untick any note you'd rather not share."
              }
            >
              <ul className="space-y-2">
                {snapshot.notes.map((note) => (
                  <li key={note.id} className="flex gap-3">
                    <Checkbox
                      className="mt-1"
                      checked={narrative.includedNoteIds.includes(note.id)}
                      onCheckedChange={(v) =>
                        patch({
                          includedNoteIds:
                            v === true
                              ? [...narrative.includedNoteIds, note.id]
                              : narrative.includedNoteIds.filter(
                                  (n) => n !== note.id,
                                ),
                        })
                      }
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">
                        {formatReportDate(note.date)}
                        {note.areaName ? ` · ${note.areaName}` : ""}
                      </p>
                      <p className="text-sm text-slate-700">{note.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* ---- Pictures ---------------------------------------------- */}
          {sections.pictures && (
            <Card
              title="Photographs"
              hint={
                snapshot.pictures.length === 0
                  ? "No photographs were posted in this period."
                  : "Up to 12 photographs print on the report."
              }
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {snapshot.pictures.map((pic) => {
                  const on = narrative.includedPictureIds.includes(pic.id);
                  return (
                    <button
                      key={pic.id}
                      type="button"
                      onClick={() =>
                        patch({
                          includedPictureIds: on
                            ? narrative.includedPictureIds.filter(
                                (p) => p !== pic.id,
                              )
                            : [...narrative.includedPictureIds, pic.id],
                        })
                      }
                      className={`relative overflow-hidden rounded-lg border-2 transition ${
                        on
                          ? "border-montessori-primary"
                          : "border-transparent opacity-50"
                      }`}
                    >
                      <img
                        src={pic.imageUrl}
                        alt={pic.caption ?? "Classroom photograph"}
                        className="aspect-square w-full bg-slate-100 object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ---- Guide's summary --------------------------------------- */}
          {sections.narrative && (
            <Card title="Guide's summary">
              <div className="space-y-4">
                <Textarea
                  value={narrative.summary}
                  onChange={(e) => patch({ summary: e.target.value })}
                  placeholder={`Summarise ${h.childName.split(" ")[0]}'s term — growth, highlights, and how they've settled…`}
                  className="min-h-28 border-slate-200 focus-visible:ring-montessori-primary"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Strengths
                    </label>
                    <Textarea
                      value={strengthsText}
                      onChange={(e) => setStrengthsText(e.target.value)}
                      placeholder="One per line"
                      className="min-h-24 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Areas for growth
                    </label>
                    <Textarea
                      value={growthText}
                      onChange={(e) => setGrowthText(e.target.value)}
                      placeholder="One per line"
                      className="min-h-24 border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ---- Final comment ------------------------------------------ */}
          {sections.signature && (
            <Card
              title="Comments"
              hint="Printed above the parent signature line."
            >
              <Textarea
                value={narrative.finalComment}
                onChange={(e) => patch({ finalComment: e.target.value })}
                className="min-h-24 border-slate-200 focus-visible:ring-montessori-primary"
              />
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSave} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={pending}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              Publish to parents
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
