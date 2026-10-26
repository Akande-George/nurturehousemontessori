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
  type CareGroupSummary,
  type ConferenceAreaBlock,
  type ConferenceAttendance,
  type ConferenceProfile,
  type DailyReportLog,
  type SharedMaterial,
  type WorkHighlights,
} from "@/lib/montessori/conference";
import { ATTENDANCE_LABELS, moodEmoji } from "@/lib/montessori/daily";
import {
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_KIND_LABELS,
  isMaterialCategory,
  materialHref,
  materialKind,
} from "@/lib/materials";

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


// ---------------------------------------------------------------------------
// Detail blocks
//
// Each one renders nothing at all when its slice of the snapshot is empty, so
// a report generated before these blocks existed — or for a child with no care
// logs — simply skips them rather than printing empty headings.
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-base text-slate-700">{children}</h2>;
}

/** Label / value pairs in a bordered grid — reads the same on screen and on paper. */
function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-1.5 last:border-b-0">
      <span className="w-40 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="min-w-0 flex-1 text-sm text-slate-700">{children}</span>
    </div>
  );
}

/** The child's standing record: placement, allergies, medication, interests. */
export function ProfileBlock({ profile }: { profile: ConferenceProfile }) {
  const hasAnything =
    profile.ageGroupLabel ||
    profile.enrolledAt ||
    profile.allergies.length > 0 ||
    profile.interests.length > 0 ||
    profile.medicalNotes ||
    profile.medications.length > 0 ||
    profile.emergencyContact ||
    profile.afterSchoolCare;
  if (!hasAnything) return null;

  return (
    <section className="mb-8 break-inside-avoid print:break-inside-avoid">
      <SectionHeading>Child details on record</SectionHeading>
      <div className="rounded-lg border border-slate-200 px-3 py-1">
        {profile.ageGroupLabel && (
          <DetailRow label="Age group">{profile.ageGroupLabel}</DetailRow>
        )}
        {profile.enrolledAt && (
          <DetailRow label="Enrolled since">
            {formatReportDate(profile.enrolledAt)}
          </DetailRow>
        )}
        {profile.interests.length > 0 && (
          <DetailRow label="Interests">
            {profile.interests.join(", ")}
          </DetailRow>
        )}
        {profile.allergies.length > 0 && (
          <DetailRow label="Allergies">
            <span className="font-medium text-rose-700">
              {profile.allergies.join(", ")}
            </span>
          </DetailRow>
        )}
        {profile.medications.length > 0 && (
          <DetailRow label="Medication">
            <ul className="space-y-0.5">
              {profile.medications.map((m, i) => (
                <li key={i}>
                  {m.name}
                  {m.dosage ? ` · ${m.dosage}` : ""}
                  {m.time ? ` · ${m.time}` : ""}
                  {m.notes ? ` — ${m.notes}` : ""}
                </li>
              ))}
            </ul>
          </DetailRow>
        )}
        {profile.medicalNotes && (
          <DetailRow label="Medical notes">
            <span className="whitespace-pre-line">{profile.medicalNotes}</span>
          </DetailRow>
        )}
        {profile.emergencyContact && (
          <DetailRow label="Emergency contact">
            {profile.emergencyContact.name}
            {profile.emergencyContact.relationship
              ? ` (${profile.emergencyContact.relationship})`
              : ""}
            {profile.emergencyContact.phone
              ? ` · ${profile.emergencyContact.phone}`
              : ""}
          </DetailRow>
        )}
        <DetailRow label="After-school care">
          {profile.afterSchoolCare ? "Enrolled" : "Not enrolled"}
        </DetailRow>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2 text-center">
      <div className="font-serif text-2xl leading-tight text-slate-800">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </div>
    </div>
  );
}

/** The period counted up — the "at a glance" band above the lesson lists. */
export function HighlightsBand({
  highlights,
}: {
  highlights: WorkHighlights;
}) {
  const empty =
    highlights.lessonsTouched === 0 &&
    highlights.practiceSessions === 0 &&
    highlights.observationCount === 0 &&
    highlights.pictureCount === 0;
  if (empty) return null;

  return (
    <section className="mb-8 break-inside-avoid print:break-inside-avoid">
      <SectionHeading>Work at a glance</SectionHeading>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Stat value={highlights.lessonsTouched} label="Lessons" />
        <Stat value={highlights.practiceSessions} label="Practices" />
        <Stat value={highlights.proficient} label="Mastered" />
        <Stat value={highlights.developing} label="Working on" />
        <Stat value={highlights.introduced} label="Introduced" />
        <Stat value={highlights.observationCount} label="Observations" />
      </div>

      {highlights.byArea.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-1.5 text-left font-semibold text-slate-700">
                  Area
                </th>
                <th className="w-24 py-1.5 text-right font-semibold text-slate-700">
                  Lessons
                </th>
                <th className="w-24 py-1.5 text-right font-semibold text-slate-700">
                  Practices
                </th>
              </tr>
            </thead>
            <tbody>
              {highlights.byArea.map((area) => (
                <tr key={area.areaId} className="border-b border-slate-100">
                  <td className="py-1.5 text-slate-600">{area.areaName}</td>
                  <td className="py-1.5 text-right text-slate-600">
                    {area.lessons}
                  </td>
                  <td className="py-1.5 text-right text-slate-600">
                    {area.practices}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {highlights.topLessons.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-1 text-sm font-semibold text-slate-700">
            Returned to most often
          </h3>
          <ul>
            {highlights.topLessons.map((lesson) => (
              <li
                key={lesson.leafId}
                className="flex items-baseline gap-2 py-[3px] text-sm"
              >
                <span className="text-slate-600">{lesson.leafName}</span>
                {lesson.areaName && (
                  <span className="text-xs text-slate-400">
                    {lesson.areaName}
                  </span>
                )}
                <span className="min-w-4 flex-1 border-b border-dotted border-slate-200" />
                <span className="text-xs text-slate-500">
                  {lesson.practiceCount}×
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Every day the child was not present, with whatever note was filed. */
export function AttendanceDaysTable({
  attendance,
}: {
  attendance: ConferenceAttendance;
}) {
  if (attendance.days.length === 0) {
    // Worth saying out loud — a clean record is the good news.
    if (attendance.period.totalRecorded === 0) return null;
    return (
      <section className="mb-8 break-inside-avoid print:break-inside-avoid">
        <SectionHeading>Attendance day by day</SectionHeading>
        <p className="text-sm italic text-slate-500">
          Present every day attendance was taken in this period.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-8 break-inside-avoid print:break-inside-avoid">
      <SectionHeading>Attendance day by day</SectionHeading>
      <p className="mb-2 text-xs text-slate-400">
        Days other than present. Every other recorded day was a full
        attendance.
      </p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-300">
            <th className="w-32 py-1.5 text-left font-semibold text-slate-700">
              Date
            </th>
            <th className="w-32 py-1.5 text-left font-semibold text-slate-700">
              Status
            </th>
            <th className="py-1.5 text-left font-semibold text-slate-700">
              Note
            </th>
          </tr>
        </thead>
        <tbody>
          {attendance.days.map((day) => (
            <tr key={day.date} className="border-b border-slate-100">
              <td className="py-1.5 text-slate-600">
                {formatReportDate(day.date)}
              </td>
              <td className="py-1.5 text-slate-700">
                {ATTENDANCE_LABELS[day.status]}
              </td>
              <td className="py-1.5 text-slate-500">{day.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** Meals, rest, nappy/toileting and temperature as logged across the period. */
export function CareLogBlock({ care }: { care: CareGroupSummary[] }) {
  if (care.length === 0) return null;
  return (
    <section className="mb-8">
      <SectionHeading>Care &amp; routine log</SectionHeading>
      <div className="space-y-5">
        {care.map((group) => (
          <div
            key={group.type}
            className="break-inside-avoid print:break-inside-avoid"
          >
            <h3 className="text-base text-slate-600">
              {group.label}{" "}
              <span className="text-xs text-slate-400">
                ({group.count} recorded)
              </span>
            </h3>
            <ul className="mt-1">
              {group.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline gap-x-2 border-b border-slate-100 py-1 text-sm last:border-b-0"
                >
                  <span className="w-24 shrink-0 text-xs text-slate-400">
                    {formatReportDate(entry.date)}
                  </span>
                  {entry.time && (
                    <span className="w-12 shrink-0 text-xs text-slate-400">
                      {entry.time}
                    </span>
                  )}
                  <span className="text-slate-700">{entry.value ?? "—"}</span>
                  {entry.notes && (
                    <span className="text-slate-500">· {entry.notes}</span>
                  )}
                  {entry.flagLabel && (
                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-700">
                      {entry.flagLabel}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {group.truncated > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                … and {group.truncated} more {group.label.toLowerCase()} entries.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Which daily reports went home, and the mood each one recorded. */
export function DailyLogBlock({ dailyLog }: { dailyLog: DailyReportLog }) {
  if (dailyLog.total === 0) return null;
  return (
    <section className="mb-8 break-inside-avoid print:break-inside-avoid">
      <SectionHeading>Daily reports in this period</SectionHeading>
      <p className="mb-2 text-sm text-slate-500">
        {dailyLog.sent} of {dailyLog.total} daily reports were sent home.
      </p>

      {dailyLog.moodTally.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {dailyLog.moodTally.map((m) => (
            <span
              key={m.mood}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-sm text-slate-600"
            >
              {moodEmoji(m.mood)} {m.mood} · {m.count}
            </span>
          ))}
        </div>
      )}

      <ul className="columns-2 gap-6 sm:columns-3">
        {dailyLog.entries.map((entry) => (
          <li
            key={entry.id}
            className="break-inside-avoid py-0.5 text-sm text-slate-600 print:break-inside-avoid"
          >
            {formatReportDate(entry.date)}
            {entry.mood ? ` · ${entry.mood}` : ""}
            {entry.sent ? "" : " (draft)"}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Documents the guide shared on this child's materials shelf in the period. */
export function MaterialsBlock({
  materials,
}: {
  materials: SharedMaterial[];
}) {
  if (materials.length === 0) return null;
  return (
    <section className="mb-8 break-inside-avoid print:break-inside-avoid">
      <SectionHeading>Documents shared with home</SectionHeading>
      <ul className="divide-y divide-slate-100 border-t border-slate-200">
        {materials.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-baseline gap-x-2 py-1.5 text-sm"
          >
            <span className="w-24 shrink-0 text-xs text-slate-400">
              {formatReportDate(m.date)}
            </span>
            <a
              href={materialHref(m.id, true)}
              className="text-slate-700 underline decoration-slate-300 underline-offset-2"
            >
              {m.title}
            </a>
            <span className="text-xs text-slate-400">
              {
                MATERIAL_CATEGORY_LABELS[
                  isMaterialCategory(m.category) ? m.category : "other"
                ]
              }{" "}
              · {MATERIAL_KIND_LABELS[materialKind(m.fileExt)]}
            </span>
          </li>
        ))}
      </ul>
    </section>
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
