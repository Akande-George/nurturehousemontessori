// Read-only building blocks for the progress report document.
//
// Server-safe (no "use client"), so the parent detail page stays fully RSC and
// html2canvas has plain DOM to snapshot. The teacher editor reuses the same
// visual language with inputs swapped in.

import {
  DEV_LEVELS,
  DEVELOPMENT_SECTIONS,
  devKey,
  type DevLevel,
} from "@/lib/montessori/development";
import {
  PROFICIENCY_HIGHLIGHT,
  PROFICIENCY_LABELS,
  PROFICIENCY_KEY,
  formatReportDate,
  type ConferenceAreaBlock,
  type ConferenceAttendance,
} from "@/lib/montessori/conference";

/** Uppercase area name over a full-width rule, as on the printed report. */
export function AreaHeading({
  name,
  description,
}: {
  name: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-light uppercase tracking-wide text-slate-700">
        {name}
      </h2>
      <div className="mt-1 border-t border-slate-300" />
      {description && (
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      )}
    </div>
  );
}

/**
 * One curriculum area: subcategory headings, then indented lesson rows with the
 * proficiency level right-aligned. Levels beyond "Introduced" get a chip.
 */
export function LessonAreaBlock({
  area,
  comment,
  emptyLabel = "No lessons recorded for this period.",
}: {
  area: ConferenceAreaBlock;
  comment?: string;
  emptyLabel?: string;
}) {
  const hasLessons = area.subcategories.length > 0;
  return (
    <section className="mb-8 break-inside-avoid print:break-inside-avoid">
      <AreaHeading name={area.areaName} description={area.areaDescription} />

      {!hasLessons ? (
        <p className="text-sm italic text-slate-400">{emptyLabel}</p>
      ) : (
        area.subcategories.map((sub) => (
          <div key={sub.subcategoryId} className="mb-4">
            <h3 className="text-base text-slate-600">{sub.subcategoryName}</h3>
            {sub.description && (
              <p className="text-xs text-slate-400">{sub.description}</p>
            )}
            <ul className="mt-1">
              {sub.lessons.map((lesson) => {
                const chip = PROFICIENCY_HIGHLIGHT[lesson.level];
                return (
                  <li
                    key={lesson.leafId}
                    className="flex items-baseline gap-2 py-[3px] pl-4 text-sm"
                  >
                    <span className="text-slate-600">{lesson.leafName}</span>
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

      {comment?.trim() && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {comment}
          </p>
        </div>
      )}
    </section>
  );
}

export function ProficiencyKey() {
  return (
    <section className="mb-8 break-inside-avoid print:break-inside-avoid">
      <h2 className="mb-2 text-base font-semibold text-slate-800">Key</h2>
      <dl className="space-y-1.5">
        {PROFICIENCY_KEY.map((entry) => (
          <div key={entry.level} className="flex gap-3 text-sm">
            <dt
              className={`w-28 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-medium ${
                PROFICIENCY_HIGHLIGHT[entry.level] ?? "bg-slate-100 text-slate-600"
              }`}
            >
              {entry.label}
            </dt>
            <dd className="text-slate-500">{entry.blurb}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Two rows — this marking period, and the academic year to date. */
export function AttendanceTable({
  attendance,
  academicYear,
}: {
  attendance: ConferenceAttendance;
  academicYear: string;
}) {
  const rows = [
    { label: "Marking period", tally: attendance.period },
    { label: academicYear, tally: attendance.year },
  ];
  return (
    <div className="mb-8 overflow-x-auto break-inside-avoid print:break-inside-avoid">
      <table className="border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-slate-200 px-3 py-1.5" />
            {["Present", "Absent", "Tardy", "Excused"].map((h) => (
              <th
                key={h}
                className="border border-slate-200 px-3 py-1.5 text-left font-semibold text-slate-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="border border-slate-200 px-3 py-1.5 font-medium text-slate-700">
                {row.label}
              </td>
              <td className="border border-slate-200 px-3 py-1.5 text-slate-600">
                {row.tally.present}
              </td>
              <td className="border border-slate-200 px-3 py-1.5 text-slate-600">
                {row.tally.absent}
              </td>
              <td className="border border-slate-200 px-3 py-1.5 text-slate-600">
                {row.tally.tardy}
              </td>
              <td className="border border-slate-200 px-3 py-1.5 text-slate-600">
                {row.tally.excused}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Read-only Rarely / Sometimes / Usually matrix — an X marks the chosen column,
 * matching the printed form. The editor renders radios instead.
 */
export function DevelopmentMatrix({
  answers,
  comments,
}: {
  answers: Record<string, DevLevel | null>;
  comments: Record<string, string>;
}) {
  return (
    <>
      {DEVELOPMENT_SECTIONS.map((section) => {
        const answered = section.items.some(
          (item) => answers[devKey(section.id, item.id)],
        );
        const comment = comments[section.id]?.trim();
        if (!answered && !comment) return null;
        return (
          <section
            key={section.id}
            className="mb-8 break-inside-avoid print:break-inside-avoid"
          >
            <h2 className="mb-2 text-base text-slate-700">{section.title}</h2>
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
                  const value = answers[devKey(section.id, item.id)];
                  return (
                    <tr key={item.id} className="border-b border-slate-100">
                      {DEV_LEVELS.map((level) => (
                        <td
                          key={level.key}
                          className="py-1.5 text-slate-700"
                          aria-label={
                            value === level.key
                              ? `${item.label}: ${level.label}`
                              : undefined
                          }
                        >
                          {value === level.key ? "X" : ""}
                        </td>
                      ))}
                      <td className="py-1.5 text-slate-600">{item.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {comment && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {comment}
                </p>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

/** Blank ruled lines the parent signs on the printed copy. */
export function SignatureBlock({ comment }: { comment: string }) {
  return (
    <section className="mt-10 break-inside-avoid print:break-inside-avoid">
      <h2 className="mb-2 text-base font-semibold text-slate-800">Comments</h2>
      <div className="min-h-20 rounded-lg border border-slate-200 p-3">
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {comment}
        </p>
      </div>
      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <div className="flex items-end gap-2">
          <span className="shrink-0">Parent&apos;s Signature</span>
          <span className="h-4 min-w-56 flex-1 border-b border-slate-400" />
        </div>
        <div className="flex items-end gap-2">
          <span className="shrink-0">Date</span>
          <span className="h-4 min-w-56 flex-1 border-b border-slate-400" />
        </div>
      </div>
    </section>
  );
}

export { formatReportDate };
