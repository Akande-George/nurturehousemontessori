// The printable daily report — everything the child did or took part in on one
// day: attendance, mood, meals and care times, the work they chose, the guide's
// observations, photographs, and notes for home.
//
// Server-safe (no "use client") so the parent detail page stays fully RSC.
// The root carries id="daily-report" — DownloadPdfButton snapshots that node,
// so every control must live OUTSIDE it in a print:hidden bar.

/* eslint-disable @next/next/no-img-element */

import {
  ATTENDANCE_LABELS,
  formatLongDate,
  moodEmoji,
  type DailyNarrative,
  type DailySections,
  type DailySnapshot,
} from "@/lib/montessori/daily";
import { LessonAreaBlock } from "./ProgressReportSections";

/** Keeps the html2canvas payload (and the PDF) to a sane size. */
const MAX_PICTURES = 12;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-slate-700">
      <span className="text-slate-500">{label}:</span> {value}
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-light uppercase tracking-wide text-slate-700">
        {children}
      </h2>
      <div className="mt-1 border-t border-slate-300" />
    </div>
  );
}

export function DailyReportDocument({
  snapshot,
  narrative,
  sections,
}: {
  snapshot: DailySnapshot;
  narrative: DailyNarrative;
  sections: DailySections;
}) {
  const h = snapshot.header;
  const firstName = h.childName.split(" ")[0] || h.childName;
  const initials = h.childName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const notes = snapshot.notes.filter((n) =>
    narrative.includedNoteIds.includes(n.id),
  );
  const allPictures = snapshot.pictures.filter((p) =>
    narrative.includedPictureIds.includes(p.id),
  );
  const pictures = allPictures.slice(0, MAX_PICTURES);
  const absent = snapshot.attendance.status === "absent";

  return (
    <div
      id="daily-report"
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10"
    >
      {/* ---- Header ---------------------------------------------------- */}
      <header className="mb-8 break-inside-avoid print:break-inside-avoid">
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${h.avatarColor || "bg-slate-300"}`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="mb-3 font-serif text-3xl text-slate-900">
                {firstName}&apos;s Daily Report
              </h1>
              <Field label="Child name" value={h.childName} />
              {h.age && <Field label="Age" value={h.age} />}
              {h.teacherName && <Field label="Teacher" value={h.teacherName} />}
              {h.classroom && <Field label="Classroom" value={h.classroom} />}
              {h.ageGroupLabel && (
                <Field label="Age band" value={h.ageGroupLabel} />
              )}
              <Field label="Date" value={formatLongDate(h.reportDate)} />
              {h.parentNames.length > 0 && (
                <Field label="Parents" value={h.parentNames.join(", ")} />
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            {h.schoolLogoUrl ? (
              <img
                src={h.schoolLogoUrl}
                alt={h.schoolName}
                crossOrigin="anonymous"
                className="ml-auto max-h-20 w-auto object-contain"
              />
            ) : (
              <p className="font-serif text-lg text-slate-700">{h.schoolName}</p>
            )}
          </div>
        </div>
      </header>

      {/* ---- Attendance + mood ------------------------------------------ */}
      {(sections.attendance || sections.mood) && (
        <section className="mb-8 break-inside-avoid print:break-inside-avoid">
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 px-4 py-3">
            {sections.attendance && snapshot.attendance.status && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Attendance
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {ATTENDANCE_LABELS[snapshot.attendance.status]}
                </p>
              </div>
            )}
            {sections.mood && narrative.mood && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  General mood
                </p>
                <p className="text-sm font-medium text-slate-800">
                  <span className="mr-1.5 text-lg">
                    {moodEmoji(narrative.mood)}
                  </span>
                  {narrative.mood}
                </p>
              </div>
            )}
            {sections.attendance && snapshot.attendance.notes && (
              <p className="text-sm text-slate-600">
                {snapshot.attendance.notes}
              </p>
            )}
          </div>
        </section>
      )}

      {absent && (
        <p className="mb-8 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {firstName} was marked absent on this day.
        </p>
      )}

      {/* ---- Care & routine --------------------------------------------- */}
      {sections.care && snapshot.care.length > 0 && (
        <section className="mb-8">
          <SectionHeading>Care &amp; Routine</SectionHeading>
          <div className="space-y-5">
            {snapshot.care.map((group) => (
              <div
                key={group.type}
                className="break-inside-avoid print:break-inside-avoid"
              >
                <h3 className="mb-1.5 text-base text-slate-600">
                  {group.label}
                </h3>
                <ul className="space-y-1">
                  {group.entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1 pl-4 text-sm"
                    >
                      <span className="w-12 shrink-0 tabular-nums text-slate-400">
                        {entry.time ?? "—"}
                      </span>
                      <span className="font-medium text-slate-800">
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
          {narrative.careComment.trim() && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {narrative.careComment}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ---- Work of the day --------------------------------------------- */}
      {sections.lessons && (
        <section className="mb-8">
          <SectionHeading>Work of the Day</SectionHeading>
          {snapshot.areas.length === 0 ? (
            <p className="text-sm italic text-slate-400">
              No lessons were recorded for {firstName} on this day.
            </p>
          ) : (
            snapshot.areas.map((area) => (
              <LessonAreaBlock key={area.areaId} area={area} />
            ))
          )}
        </section>
      )}

      {/* ---- Observations ------------------------------------------------ */}
      {sections.notes && notes.length > 0 && (
        <section className="mb-8">
          <SectionHeading>Observations</SectionHeading>
          <ul className="space-y-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="break-inside-avoid rounded-lg border border-slate-200 p-3 print:break-inside-avoid"
              >
                <p className="mb-1 text-xs text-slate-400">
                  {note.time ?? ""}
                  {note.time && note.areaName ? " · " : ""}
                  {note.areaName ?? ""}
                  {note.activityName && note.activityName !== "General"
                    ? ` · ${note.activityName}`
                    : ""}
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {note.content}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- Photographs -------------------------------------------------- */}
      {sections.pictures && pictures.length > 0 && (
        <section className="mb-8">
          <SectionHeading>Photographs</SectionHeading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {pictures.map((pic) => (
              <figure
                key={pic.id}
                className="break-inside-avoid print:break-inside-avoid"
              >
                <img
                  src={pic.imageUrl}
                  alt={pic.caption ?? "Classroom photograph"}
                  crossOrigin="anonymous"
                  className="aspect-square w-full rounded-lg border border-slate-200 bg-slate-100 object-cover"
                />
                {pic.caption && (
                  <figcaption className="mt-1 text-xs text-slate-500">
                    {pic.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
          {allPictures.length > MAX_PICTURES && (
            <p className="mt-2 text-xs text-slate-400">
              Showing the first {MAX_PICTURES} of {allPictures.length}{" "}
              photographs.
            </p>
          )}
        </section>
      )}

      {/* ---- Teacher's note ----------------------------------------------- */}
      {sections.summary &&
        (narrative.summary.trim() || narrative.highlights.length > 0) && (
          <section className="mb-8 break-inside-avoid print:break-inside-avoid">
            <SectionHeading>From {firstName}&apos;s Guide</SectionHeading>
            {narrative.summary.trim() && (
              <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {narrative.summary}
              </p>
            )}
            {narrative.highlights.length > 0 && (
              <ul className="space-y-1">
                {narrative.highlights.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-emerald-500">✓</span> {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

      {/* ---- Reminders for home -------------------------------------------- */}
      {sections.reminders && narrative.reminders.length > 0 && (
        <section className="break-inside-avoid print:break-inside-avoid">
          <SectionHeading>For Home</SectionHeading>
          <ul className="space-y-1">
            {narrative.reminders.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-amber-500">→</span> {item}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
