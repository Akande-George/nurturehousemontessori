// The printable progress report itself.
//
// Server-safe (no "use client") so the parent detail page stays fully RSC.
// The root carries id="progress-report" — DownloadPdfButton snapshots that node
// with html2canvas, so every control must live OUTSIDE it in a print:hidden bar.

/* eslint-disable @next/next/no-img-element */

import { CHARACTER_TRAITS, RATING_LABELS } from "@/lib/montessori/character";
import {
  TERM_LABELS,
  formatReportDate,
  type ConferenceNarrative,
  type ConferenceSections,
  type ConferenceSnapshot,
} from "@/lib/montessori/conference";
import {
  AttendanceTable,
  DevelopmentMatrix,
  LessonAreaBlock,
  ProficiencyKey,
  SignatureBlock,
} from "./ProgressReportSections";

/** Keeps the html2canvas payload (and the PDF) to a sane size. */
const MAX_PICTURES = 12;

function Stars({ value }: { value: number }) {
  return (
    <span className="tracking-widest text-amber-500" aria-label={`${value} of 5`}>
      {"★".repeat(value)}
      <span className="text-slate-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-slate-700">
      <span className="text-slate-500">{label}:</span> {value}
    </p>
  );
}

export function ProgressReportDocument({
  title,
  snapshot,
  narrative,
  sections,
}: {
  title: string;
  snapshot: ConferenceSnapshot;
  narrative: ConferenceNarrative;
  sections: ConferenceSections;
}) {
  const h = snapshot.header;
  const initials = h.childName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const notes = snapshot.notes.filter((n) =>
    narrative.includedNoteIds.includes(n.id),
  );
  const pictures = snapshot.pictures
    .filter((p) => narrative.includedPictureIds.includes(p.id))
    .slice(0, MAX_PICTURES);

  const hasNarrative =
    narrative.summary.trim() ||
    narrative.strengths.length > 0 ||
    narrative.areasForGrowth.length > 0;
  const ratedTraits = CHARACTER_TRAITS.filter((t) => (narrative.character[t] ?? 0) > 0);

  return (
    <div
      id="progress-report"
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
              <h1 className="mb-3 font-serif text-3xl text-slate-900">{title}</h1>
              <Field label="Child name" value={h.childName} />
              {h.ageAtEnd && <Field label="Age" value={h.ageAtEnd} />}
              {h.teacherName && <Field label="Teacher" value={h.teacherName} />}
              {h.classroom && <Field label="Classroom" value={h.classroom} />}
              <Field
                label="Marking period"
                value={`${formatReportDate(h.periodStart)} – ${formatReportDate(h.periodEnd)}`}
              />
              <Field
                label="Term"
                value={`${TERM_LABELS[h.term]} · ${h.academicYear}`}
              />
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

      {/* ---- Attendance ------------------------------------------------ */}
      {sections.attendance && (
        <AttendanceTable
          attendance={snapshot.attendance}
          academicYear={h.academicYear}
        />
      )}

      {/* ---- Lessons this period --------------------------------------- */}
      {sections.lessons &&
        snapshot.areas.map((area) => (
          <LessonAreaBlock
            key={area.areaId}
            area={area}
            comment={narrative.areaComments[area.areaId]}
          />
        ))}

      {sections.key && <ProficiencyKey />}

      {/* ---- Developmental checklists ---------------------------------- */}
      {sections.development && (
        <DevelopmentMatrix
          answers={narrative.development}
          comments={narrative.developmentComments}
        />
      )}

      {/* ---- Character profile ----------------------------------------- */}
      {sections.character && ratedTraits.length > 0 && (
        <section className="mb-8 break-inside-avoid print:break-inside-avoid">
          <h2 className="mb-2 text-base text-slate-700">Character Profile</h2>
          <div className="divide-y divide-slate-100 border-t border-slate-200">
            {ratedTraits.map((trait) => (
              <div
                key={trait}
                className="flex items-center justify-between gap-4 py-2"
              >
                <span className="text-sm text-slate-700">{trait}</span>
                <span className="flex items-center gap-3">
                  <span className="hidden text-xs text-slate-400 sm:inline">
                    {RATING_LABELS[narrative.character[trait]]}
                  </span>
                  <Stars value={narrative.character[trait]} />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Observation notes ----------------------------------------- */}
      {sections.notes && notes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base text-slate-700">Observation Notes</h2>
          <ul className="space-y-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="break-inside-avoid rounded-lg border border-slate-200 p-3 print:break-inside-avoid"
              >
                <p className="mb-1 text-xs text-slate-400">
                  {formatReportDate(note.date)}
                  {note.areaName ? ` · ${note.areaName}` : ""}
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

      {/* ---- Photographs ------------------------------------------------ */}
      {sections.pictures && pictures.length > 0 && (
        <section className="mb-8 break-before-page print:break-before-page">
          <h2 className="mb-3 text-base text-slate-700">Photographs</h2>
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
          {snapshot.pictures.filter((p) =>
            narrative.includedPictureIds.includes(p.id),
          ).length > MAX_PICTURES && (
            <p className="mt-2 text-xs text-slate-400">
              Showing the first {MAX_PICTURES} photographs.
            </p>
          )}
        </section>
      )}

      {/* ---- Guide's summary -------------------------------------------- */}
      {sections.narrative && hasNarrative && (
        <section className="mb-8 break-inside-avoid print:break-inside-avoid">
          <h2 className="mb-2 text-base text-slate-700">Guide&apos;s Summary</h2>
          {narrative.summary.trim() && (
            <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {narrative.summary}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {narrative.strengths.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-700">
                  Strengths
                </h3>
                <ul className="space-y-1">
                  {narrative.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-emerald-500">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {narrative.areasForGrowth.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-700">
                  Areas for growth
                </h3>
                <ul className="space-y-1">
                  {narrative.areasForGrowth.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-amber-500">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---- Everything to date ----------------------------------------- */}
      {sections.cumulative && (
        <section className="break-before-page print:break-before-page">
          <h2 className="mb-1 font-serif text-2xl text-slate-800">
            Everything to date
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Every lesson {h.childName.split(" ")[0]} has worked with since
            joining, with where they are today.
          </p>
          {snapshot.cumulativeAreas.map((area) => (
            <LessonAreaBlock
              key={area.areaId}
              area={area}
              emptyLabel="No lessons recorded in this area yet."
            />
          ))}
        </section>
      )}

      {/* ---- Comments & signature ---------------------------------------- */}
      {sections.signature && <SignatureBlock comment={narrative.finalComment} />}
    </div>
  );
}
