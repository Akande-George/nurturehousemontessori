"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Loader2, RefreshCw, Send, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  regenerateDailySnapshot,
  sendDailyReport,
  unsendDailyReport,
  updateDailyReport,
} from "@/lib/actions/daily";
import {
  DAILY_SECTION_LABELS,
  MOOD_OPTIONS,
  formatLongDate,
  type DailyNarrative,
  type DailySections,
  type DailySnapshot,
} from "@/lib/montessori/daily";
import { DailyReportDocument } from "@/components/montessori/DailyReportDocument";
import { LessonAreaBlock } from "@/components/montessori/ProgressReportSections";
import type { Enums } from "@/lib/db/types";

const toLines = (s: string) =>
  s.split("\n").map((l) => l.trim()).filter(Boolean);

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

export function DailyReportEditorClient({
  id,
  status,
  snapshot,
  narrative: initialNarrative,
  sections: initialSections,
}: {
  id: string;
  status: Enums["daily_report_status"];
  snapshot: DailySnapshot;
  narrative: DailyNarrative;
  sections: DailySections;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState(false);

  const sent = status === "sent";
  const [narrative, setNarrative] = useState(initialNarrative);
  const [sections, setSections] = useState(initialSections);
  const [highlightsText, setHighlightsText] = useState(
    initialNarrative.highlights.join("\n"),
  );
  const [remindersText, setRemindersText] = useState(
    initialNarrative.reminders.join("\n"),
  );

  const patch = (p: Partial<DailyNarrative>) =>
    setNarrative((prev) => ({ ...prev, ...p }));

  const currentNarrative = (): DailyNarrative => ({
    ...narrative,
    highlights: toLines(highlightsText),
    reminders: toLines(remindersText),
  });

  const h = snapshot.header;
  const firstName = h.childName.split(" ")[0] || h.childName;

  const handleSave = () =>
    start(async () => {
      const res = await updateDailyReport({
        id,
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
      const res = await regenerateDailySnapshot(id);
      toast(
        res.ok
          ? {
              title: "Refreshed",
              description:
                "Care logs, lessons, observations and photos re-collected. Your writing is untouched.",
            }
          : { title: res.error ?? "Could not refresh", variant: "destructive" },
      );
      if (res.ok) router.refresh();
    });

  const handleSend = () =>
    start(async () => {
      // Persist edits first — sending freezes the document.
      const saved = await updateDailyReport({
        id,
        sections,
        narrative: currentNarrative(),
      });
      if (!saved.ok) {
        toast({ title: saved.error ?? "Could not save", variant: "destructive" });
        return;
      }
      const res = await sendDailyReport(id);
      toast(
        res.ok
          ? {
              title: "Sent",
              description: `${firstName}'s parents can now read and download this report.`,
            }
          : { title: res.error ?? "Could not send", variant: "destructive" },
      );
      if (res.ok) router.refresh();
    });

  const handleUnsend = () =>
    start(async () => {
      const res = await unsendDailyReport(id);
      toast(
        res.ok
          ? { title: "Moved back to draft" }
          : { title: res.error ?? "Could not unsend", variant: "destructive" },
      );
      if (res.ok) router.refresh();
    });

  return (
    <div className="mx-auto max-w-4xl pb-24">
      {/* ---- Chrome (never part of the printed document) ----------------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/teacher/reports/daily">
            <ArrowLeft className="h-4 w-4" /> All daily reports
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={
              sent
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }
          >
            {sent ? "Sent" : "Draft"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreview((p) => !p)}
            className="gap-1.5"
          >
            <Eye className="h-4 w-4" /> {preview ? "Edit" : "Preview"}
          </Button>
          {sent ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnsend}
              disabled={pending}
              className="gap-1.5"
            >
              <Undo2 className="h-4 w-4" /> Move to draft
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
                onClick={handleSend}
                disabled={pending}
                className="gap-1.5 bg-montessori-primary text-white hover:bg-montessori-primary/90"
              >
                <Send className="h-4 w-4" /> Send to parents
              </Button>
            </>
          )}
        </div>
      </div>

      {sent && (
        <p className="mb-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 print:hidden">
          This report has been sent and is locked. Move it back to draft to make
          changes — parents will lose access until you send it again.
        </p>
      )}

      {preview || sent ? (
        <DailyReportDocument
          snapshot={snapshot}
          narrative={currentNarrative()}
          sections={sections}
        />
      ) : (
        <div className="space-y-5">
          <Card
            title={`${h.childName} — ${formatLongDate(h.reportDate)}`}
            hint={[h.classroom, h.ageGroupLabel].filter(Boolean).join(" · ")}
          >
            <p className="text-xs text-slate-400">
              {snapshot.care.reduce((n, g) => n + g.entries.length, 0)} care
              entries ·{" "}
              {snapshot.areas.reduce(
                (n, a) =>
                  n +
                  a.subcategories.reduce((m, s) => m + s.lessons.length, 0),
                0,
              )}{" "}
              lessons · {snapshot.notes.length} observations ·{" "}
              {snapshot.pictures.length} photos
              {snapshot.attendance.status
                ? ` · marked ${snapshot.attendance.status}`
                : ""}
            </p>
          </Card>

          {/* ---- Sections ---------------------------------------------- */}
          <Card
            title="Sections"
            hint="Untick anything you don't want on this report."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DAILY_SECTION_LABELS.map(({ key, label }) => (
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

          {/* ---- Mood --------------------------------------------------- */}
          {sections.mood && (
            <Card title="General mood" hint="How was the day overall?">
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() =>
                      patch({ mood: narrative.mood === m.value ? "" : m.value })
                    }
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                      narrative.mood === m.value
                        ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-base">{m.emoji}</span>
                    {m.value}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* ---- Care & routine ----------------------------------------- */}
          {sections.care && (
            <Card
              title="Care & routine"
              hint={
                snapshot.care.length === 0
                  ? "Nothing was logged for this day — add entries in Bulk Logging, then Refresh data."
                  : "Collected from Bulk Logging. Add a comment for parents if you'd like."
              }
            >
              <div className="space-y-4">
                {snapshot.care.map((group) => (
                  <div key={group.type}>
                    <h3 className="mb-1 text-sm font-medium text-slate-700">
                      {group.label}
                    </h3>
                    <ul className="space-y-0.5">
                      {group.entries.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex flex-wrap items-baseline gap-x-3 text-sm"
                        >
                          <span className="w-12 shrink-0 tabular-nums text-slate-400">
                            {entry.time ?? "—"}
                          </span>
                          <span className="text-slate-800">
                            {entry.value ?? "—"}
                          </span>
                          {entry.flag && (
                            <span
                              className={`rounded border px-1.5 py-0.5 text-xs font-medium ${entry.flag.className}`}
                            >
                              {entry.flag.label}
                            </span>
                          )}
                          {entry.notes && (
                            <span className="text-slate-500">{entry.notes}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <Textarea
                value={narrative.careComment}
                onChange={(e) => patch({ careComment: e.target.value })}
                placeholder="Anything to add about meals, rest or nappies…"
                className="mt-3 min-h-20 border-slate-200 focus-visible:ring-montessori-primary"
              />
            </Card>
          )}

          {/* ---- Work of the day ---------------------------------------- */}
          {sections.lessons && (
            <Card
              title="Work of the day"
              hint={
                snapshot.areas.length === 0
                  ? "No lessons recorded for this date. Record practices in Curriculum, then Refresh data."
                  : "Pulled from the curriculum record for this date."
              }
            >
              {snapshot.areas.map((area) => (
                <LessonAreaBlock key={area.areaId} area={area} />
              ))}
            </Card>
          )}

          {/* ---- Observations -------------------------------------------- */}
          {sections.notes && (
            <Card
              title="Observations"
              hint={
                snapshot.notes.length === 0
                  ? "No observations were logged on this date."
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
                        {note.time ?? ""}
                        {note.time && note.areaName ? " · " : ""}
                        {note.areaName ?? ""}
                      </p>
                      <p className="text-sm text-slate-700">{note.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* ---- Photographs ---------------------------------------------- */}
          {sections.pictures && (
            <Card
              title="Photographs"
              hint={
                snapshot.pictures.length === 0
                  ? "No photographs were posted on this date."
                  : "Tap to include or exclude. Up to 12 print on the report."
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

          {/* ---- Teacher's note -------------------------------------------- */}
          {sections.summary && (
            <Card title="Your note to parents">
              <div className="space-y-4">
                <Textarea
                  value={narrative.summary}
                  onChange={(e) => patch({ summary: e.target.value })}
                  placeholder={`How was ${firstName}'s day? What did they gravitate towards…`}
                  className="min-h-28 border-slate-200 focus-visible:ring-montessori-primary"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Highlights
                  </label>
                  <Textarea
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    placeholder="One per line"
                    className="min-h-20 border-slate-200"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* ---- Reminders --------------------------------------------------- */}
          {sections.reminders && (
            <Card
              title="For home"
              hint="Supplies to send in, things to follow up — one per line."
            >
              <Textarea
                value={remindersText}
                onChange={(e) => setRemindersText(e.target.value)}
                placeholder={"Spare change of clothes\nLibrary book due Friday"}
                className="min-h-20 border-slate-200 focus-visible:ring-montessori-primary"
              />
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSave} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save draft
            </Button>
            <Button
              onClick={handleSend}
              disabled={pending}
              className="bg-montessori-primary text-white hover:bg-montessori-primary/90"
            >
              Send to parents
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
