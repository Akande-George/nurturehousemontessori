// Payload types for the Montessori progress report (Transparent Classroom
// style conference report), in both its forms: the end-of-term report and the
// mid-term report. The two are the same document over a different window —
// `header.reportType` is the only thing that differs structurally.
//
// A report row splits into three jsonb columns:
//   snapshot  -- auto-collected facts, frozen at generate, never edited
//   narrative -- everything the teacher types
//   sections  -- which sections appear on this report
//
// Client-safe: no `server-only`, no supabase imports. The read* helpers below
// never throw on malformed or legacy jsonb — same defensive style as
// `readTheme()` / `invoiceLineItems()` in src/lib/db/types.ts. Snapshots
// written before a block existed simply read back empty, and every section
// that renders one hides itself when it is.

import type { AttendanceStatus, CurriculumStatus, Term } from "@/lib/db/types";
import { CHARACTER_TRAITS } from "./character";
import { DEVELOPMENT_SECTIONS, type DevLevel } from "./development";
import type {
  LessonAreaGroup,
  LessonEntry,
  LessonSubcategoryBlock,
} from "./lessons";

// ---------------------------------------------------------------------------
// Report kind
// ---------------------------------------------------------------------------

/**
 * Mid-term and end-of-term reports share one table, one editor and one parent
 * view; `report_type` only decides the wording and lets both exist for the
 * same term (the unique key is student + year + term + type).
 */
export type ReportKind = "termly" | "midterm";

export const REPORT_KINDS: ReportKind[] = ["termly", "midterm"];

export const REPORT_KIND_LABELS: Record<ReportKind, string> = {
  termly: "End of Term Report",
  midterm: "Mid-Term Report",
};

/** For chips and table cells, where the full label is too long. */
export const REPORT_KIND_SHORT: Record<ReportKind, string> = {
  termly: "End of term",
  midterm: "Mid-term",
};

export const REPORT_KIND_BLURB: Record<ReportKind, string> = {
  termly:
    "The full picture of the term — everything recorded for this child between the two dates.",
  midterm:
    "A halfway checkpoint, so nothing waits until the end of term to be said.",
};

export function readReportKind(value: unknown): ReportKind {
  return value === "midterm" ? "midterm" : "termly";
}

/** Default document title, e.g. "Zoe's Mid-Term Report". */
export function defaultReportTitle(
  childName: string,
  kind: ReportKind,
): string {
  const firstName = childName.split(" ")[0] || childName;
  return `${firstName}'s ${kind === "midterm" ? "Mid-Term Report" : "Progress Report"}`;
}

// ---------------------------------------------------------------------------
// Proficiency wording
// ---------------------------------------------------------------------------

// The app's curriculum_status enum rendered in the guide's language.
export const PROFICIENCY_LABELS: Record<CurriculumStatus, string> = {
  not_started: "—",
  introduced: "Introduced",
  developing: "Working on",
  proficient: "Mastered",
};

// Only levels beyond "Introduced" get a highlight chip on the report.
export const PROFICIENCY_HIGHLIGHT: Record<CurriculumStatus, string | null> = {
  not_started: null,
  introduced: null,
  developing: "bg-sky-100 text-sky-800",
  proficient: "bg-emerald-100 text-emerald-800",
};

export const PROFICIENCY_KEY: {
  level: CurriculumStatus;
  label: string;
  blurb: string;
}[] = [
  {
    level: "introduced",
    label: PROFICIENCY_LABELS.introduced,
    blurb: "The lesson has been presented and the child has begun to explore it.",
  },
  {
    level: "developing",
    label: PROFICIENCY_LABELS.developing,
    blurb: "The child returns to the work and is building confidence with it.",
  },
  {
    level: "proficient",
    label: PROFICIENCY_LABELS.proficient,
    blurb: "The child works independently and can show the lesson to a friend.",
  },
];

// ---------------------------------------------------------------------------
// Section toggles
// ---------------------------------------------------------------------------

export type ConferenceSectionKey =
  | "profile"
  | "attendance"
  | "attendanceDays"
  | "highlights"
  | "lessons"
  | "key"
  | "development"
  | "character"
  | "careLog"
  | "dailyLog"
  | "notes"
  | "pictures"
  | "materials"
  | "narrative"
  | "cumulative"
  | "signature";

export type ConferenceSections = Record<ConferenceSectionKey, boolean>;

export const SECTION_LABELS: { key: ConferenceSectionKey; label: string }[] = [
  { key: "profile", label: "Child details on record" },
  { key: "attendance", label: "Attendance summary" },
  { key: "attendanceDays", label: "Attendance day by day" },
  { key: "highlights", label: "Work at a glance" },
  { key: "lessons", label: "Lessons this period" },
  { key: "key", label: "Key to the levels" },
  { key: "development", label: "Developmental checklists" },
  { key: "character", label: "Character profile" },
  { key: "careLog", label: "Care & routine log" },
  { key: "dailyLog", label: "Daily reports in this period" },
  { key: "notes", label: "Observation notes" },
  { key: "pictures", label: "Photographs" },
  { key: "materials", label: "Documents shared with home" },
  { key: "narrative", label: "Guide's summary" },
  { key: "cumulative", label: "Everything to date" },
  { key: "signature", label: "Comments & signature" },
];

export const DEFAULT_SECTIONS: ConferenceSections = {
  profile: true,
  attendance: true,
  attendanceDays: true,
  highlights: true,
  lessons: true,
  key: true,
  development: true,
  character: true,
  careLog: true,
  dailyLog: true,
  notes: true,
  pictures: true,
  materials: true,
  narrative: true,
  cumulative: true,
  signature: true,
};

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

export type ConferenceHeader = {
  schoolName: string;
  schoolLogoUrl: string | null;
  childName: string;
  avatarColor: string;
  ageAtEnd: string | null;
  birthday: string | null;
  classroom: string | null;
  teacherName: string;
  reportType: ReportKind;
  term: Term;
  academicYear: string;
  periodStart: string;
  periodEnd: string;
  parentNames: string[];
};

/** Everything held on the child's record, as it stood when the report ran. */
export type ConferenceProfile = {
  ageGroupLabel: string | null;
  enrolledAt: string | null;
  allergies: string[];
  interests: string[];
  medicalNotes: string | null;
  medications: {
    name: string;
    dosage: string | null;
    time: string | null;
    notes: string | null;
  }[];
  afterSchoolCare: boolean;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  } | null;
};

// Lesson shapes are shared with the daily report — see ./lessons.ts.
export type ConferenceLesson = LessonEntry;
export type ConferenceSubcategoryBlock = LessonSubcategoryBlock;
export type ConferenceAreaBlock = LessonAreaGroup;

export type ConferenceNote = {
  id: string;
  date: string;
  areaId: string | null;
  areaName: string | null;
  activityName: string | null;
  content: string;
};

export type ConferencePicture = {
  id: string;
  imageUrl: string;
  caption: string | null;
  date: string;
  areaName: string | null;
};

export type AttendanceTally = {
  present: number;
  absent: number;
  tardy: number;
  excused: number;
  totalRecorded: number;
};

/** A day the child was anything other than present — the exceptions list. */
export type AttendanceDay = {
  date: string;
  status: AttendanceStatus;
  notes: string | null;
};

export type ConferenceAttendance = {
  period: AttendanceTally;
  year: AttendanceTally;
  /** Non-present days inside the marking period, oldest first. */
  days: AttendanceDay[];
};

/** The counted shape of the period's work, for the stat band. */
export type WorkHighlights = {
  lessonsTouched: number;
  introduced: number;
  developing: number;
  proficient: number;
  practiceSessions: number;
  observationCount: number;
  pictureCount: number;
  byArea: {
    areaId: string;
    areaName: string;
    lessons: number;
    practices: number;
  }[];
  topLessons: {
    leafId: string;
    leafName: string;
    areaName: string;
    practiceCount: number;
    level: CurriculumStatus;
  }[];
};

export type CareEntry = {
  id: string;
  date: string;
  time: string | null;
  value: string | null;
  notes: string | null;
  /** e.g. "Fever — parents notified"; set only for temperature readings. */
  flagLabel: string | null;
};

export type CareGroupSummary = {
  type: string;
  label: string;
  count: number;
  entries: CareEntry[];
  /** How many entries were left off `entries` to keep the document readable. */
  truncated: number;
};

export type DailyReportEntry = {
  id: string;
  date: string;
  mood: string | null;
  sent: boolean;
};

export type DailyReportLog = {
  total: number;
  sent: number;
  entries: DailyReportEntry[];
  moodTally: { mood: string; count: number }[];
};

export type SharedMaterial = {
  id: string;
  title: string;
  category: string;
  fileName: string;
  fileExt: string;
  date: string;
};

export type ConferenceSnapshot = {
  version: 2;
  header: ConferenceHeader;
  profile: ConferenceProfile;
  areas: ConferenceAreaBlock[];
  cumulativeAreas: ConferenceAreaBlock[];
  highlights: WorkHighlights;
  notes: ConferenceNote[];
  pictures: ConferencePicture[];
  attendance: ConferenceAttendance;
  care: CareGroupSummary[];
  dailyLog: DailyReportLog;
  materials: SharedMaterial[];
};

// ---------------------------------------------------------------------------
// Narrative (everything the teacher types)
// ---------------------------------------------------------------------------

export type ConferenceNarrative = {
  summary: string;
  strengths: string[];
  areasForGrowth: string[];
  /** areaId -> the comment box at the end of that area's lesson list. */
  areaComments: Record<string, string>;
  /** "<sectionId>:<itemId>" -> level, from src/lib/montessori/development.ts */
  development: Record<string, DevLevel | null>;
  /** sectionId -> comment box under that matrix. */
  developmentComments: Record<string, string>;
  /** Character trait -> 1..5 stars. */
  character: Record<string, number>;
  includedNoteIds: string[];
  includedPictureIds: string[];
  finalComment: string;
};

// ---------------------------------------------------------------------------
// Defensive readers
// ---------------------------------------------------------------------------

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

const strOrNull = (v: unknown): string | null =>
  typeof v === "string" ? v : null;

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const bool = (v: unknown): boolean => v === true;

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const objArray = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter(isObj) : [];

const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;

const CURRICULUM_STATUSES = [
  "not_started",
  "introduced",
  "developing",
  "proficient",
] as const;

function readCurriculumStatus(v: unknown): CurriculumStatus {
  return (CURRICULUM_STATUSES as readonly string[]).includes(v as string)
    ? (v as CurriculumStatus)
    : "introduced";
}

export function readSections(value: unknown): ConferenceSections {
  const raw = isObj(value) ? value : {};
  const out = { ...DEFAULT_SECTIONS };
  for (const key of Object.keys(DEFAULT_SECTIONS) as ConferenceSectionKey[]) {
    if (typeof raw[key] === "boolean") out[key] = raw[key];
  }
  return out;
}

function readTally(value: unknown): AttendanceTally {
  const raw = isObj(value) ? value : {};
  return {
    present: num(raw.present),
    absent: num(raw.absent),
    tardy: num(raw.tardy),
    excused: num(raw.excused),
    totalRecorded: num(raw.totalRecorded),
  };
}

function readAttendanceDays(value: unknown): AttendanceDay[] {
  return objArray(value)
    .filter((d) =>
      (ATTENDANCE_STATUSES as readonly string[]).includes(d.status as string),
    )
    .map((d) => ({
      date: str(d.date),
      status: d.status as AttendanceStatus,
      notes: strOrNull(d.notes),
    }));
}

function readProfile(value: unknown): ConferenceProfile {
  const raw = isObj(value) ? value : {};
  const contact = isObj(raw.emergencyContact) ? raw.emergencyContact : null;
  return {
    ageGroupLabel: strOrNull(raw.ageGroupLabel),
    enrolledAt: strOrNull(raw.enrolledAt),
    allergies: strArray(raw.allergies),
    interests: strArray(raw.interests),
    medicalNotes: strOrNull(raw.medicalNotes),
    medications: objArray(raw.medications).map((m) => ({
      name: str(m.name),
      dosage: strOrNull(m.dosage),
      time: strOrNull(m.time),
      notes: strOrNull(m.notes),
    })),
    afterSchoolCare: bool(raw.afterSchoolCare),
    emergencyContact: contact
      ? {
          name: str(contact.name),
          phone: str(contact.phone),
          relationship: str(contact.relationship),
        }
      : null,
  };
}

function readHighlights(value: unknown): WorkHighlights {
  const raw = isObj(value) ? value : {};
  return {
    lessonsTouched: num(raw.lessonsTouched),
    introduced: num(raw.introduced),
    developing: num(raw.developing),
    proficient: num(raw.proficient),
    practiceSessions: num(raw.practiceSessions),
    observationCount: num(raw.observationCount),
    pictureCount: num(raw.pictureCount),
    byArea: objArray(raw.byArea).map((a) => ({
      areaId: str(a.areaId),
      areaName: str(a.areaName),
      lessons: num(a.lessons),
      practices: num(a.practices),
    })),
    topLessons: objArray(raw.topLessons).map((l) => ({
      leafId: str(l.leafId),
      leafName: str(l.leafName),
      areaName: str(l.areaName),
      practiceCount: num(l.practiceCount),
      level: readCurriculumStatus(l.level),
    })),
  };
}

function readCare(value: unknown): CareGroupSummary[] {
  return objArray(value).map((group) => ({
    type: str(group.type),
    label: str(group.label),
    count: num(group.count),
    truncated: num(group.truncated),
    entries: objArray(group.entries).map((e) => ({
      id: str(e.id),
      date: str(e.date),
      time: strOrNull(e.time),
      value: strOrNull(e.value),
      notes: strOrNull(e.notes),
      flagLabel: strOrNull(e.flagLabel),
    })),
  }));
}

function readDailyLog(value: unknown): DailyReportLog {
  const raw = isObj(value) ? value : {};
  return {
    total: num(raw.total),
    sent: num(raw.sent),
    entries: objArray(raw.entries).map((e) => ({
      id: str(e.id),
      date: str(e.date),
      mood: strOrNull(e.mood),
      sent: bool(e.sent),
    })),
    moodTally: objArray(raw.moodTally).map((m) => ({
      mood: str(m.mood),
      count: num(m.count),
    })),
  };
}

function readMaterials(value: unknown): SharedMaterial[] {
  return objArray(value).map((m) => ({
    id: str(m.id),
    title: str(m.title),
    category: str(m.category, "resource"),
    fileName: str(m.fileName),
    fileExt: str(m.fileExt),
    date: str(m.date),
  }));
}

function readAreaBlocks(value: unknown): ConferenceAreaBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isObj).map((area) => ({
    areaId: str(area.areaId),
    areaName: str(area.areaName),
    areaDescription: str(area.areaDescription),
    subcategories: (Array.isArray(area.subcategories) ? area.subcategories : [])
      .filter(isObj)
      .map((sub) => ({
        subcategoryId: str(sub.subcategoryId),
        subcategoryName: str(sub.subcategoryName),
        description: strOrNull(sub.description),
        lessons: (Array.isArray(sub.lessons) ? sub.lessons : [])
          .filter(isObj)
          .map((lesson) => ({
            leafId: str(lesson.leafId),
            leafName: str(lesson.leafName),
            level: readCurriculumStatus(lesson.level),
            practiceCount: num(lesson.practiceCount),
            lastPracticedOn: strOrNull(lesson.lastPracticedOn),
          })),
      })),
  }));
}

/**
 * Returns null when the row has never been generated (empty `{}` snapshot).
 *
 * Reports generated before the detail blocks existed (version 1) still parse:
 * every new block falls back to empty, and each section that renders one hides
 * itself when there is nothing in it.
 */
export function readSnapshot(value: unknown): ConferenceSnapshot | null {
  if (!isObj(value) || !isObj(value.header)) return null;
  const h = value.header;
  const attendance = isObj(value.attendance) ? value.attendance : {};
  return {
    version: 2,
    header: {
      schoolName: str(h.schoolName),
      schoolLogoUrl: strOrNull(h.schoolLogoUrl),
      childName: str(h.childName),
      avatarColor: str(h.avatarColor, "bg-slate-200"),
      ageAtEnd: strOrNull(h.ageAtEnd),
      birthday: strOrNull(h.birthday),
      classroom: strOrNull(h.classroom),
      teacherName: str(h.teacherName),
      reportType: readReportKind(h.reportType),
      term: (["first", "second", "third"] as const).includes(h.term as Term)
        ? (h.term as Term)
        : "first",
      academicYear: str(h.academicYear),
      periodStart: str(h.periodStart),
      periodEnd: str(h.periodEnd),
      parentNames: strArray(h.parentNames),
    },
    profile: readProfile(value.profile),
    areas: readAreaBlocks(value.areas),
    cumulativeAreas: readAreaBlocks(value.cumulativeAreas),
    highlights: readHighlights(value.highlights),
    notes: objArray(value.notes).map((n) => ({
      id: str(n.id),
      date: str(n.date),
      areaId: strOrNull(n.areaId),
      areaName: strOrNull(n.areaName),
      activityName: strOrNull(n.activityName),
      content: str(n.content),
    })),
    pictures: objArray(value.pictures).map((p) => ({
      id: str(p.id),
      imageUrl: str(p.imageUrl),
      caption: strOrNull(p.caption),
      date: str(p.date),
      areaName: strOrNull(p.areaName),
    })),
    attendance: {
      period: readTally(attendance.period),
      year: readTally(attendance.year),
      days: readAttendanceDays(attendance.days),
    },
    care: readCare(value.care),
    dailyLog: readDailyLog(value.dailyLog),
    materials: readMaterials(value.materials),
  };
}

export function readNarrative(value: unknown): ConferenceNarrative {
  const raw = isObj(value) ? value : {};
  const record = (v: unknown): Record<string, string> => {
    const src = isObj(v) ? v : {};
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(src)) {
      if (typeof val === "string") out[k] = val;
    }
    return out;
  };
  const devLevels = isObj(raw.development) ? raw.development : {};
  const development: Record<string, DevLevel | null> = {};
  for (const [k, val] of Object.entries(devLevels)) {
    if (val === "rarely" || val === "sometimes" || val === "usually") {
      development[k] = val;
    }
  }
  const characterRaw = isObj(raw.character) ? raw.character : {};
  const character: Record<string, number> = {};
  for (const [k, val] of Object.entries(characterRaw)) {
    if (typeof val === "number" && val >= 1 && val <= 5) character[k] = val;
  }
  return {
    summary: str(raw.summary),
    strengths: strArray(raw.strengths),
    areasForGrowth: strArray(raw.areasForGrowth),
    areaComments: record(raw.areaComments),
    development,
    developmentComments: record(raw.developmentComments),
    character,
    includedNoteIds: strArray(raw.includedNoteIds),
    includedPictureIds: strArray(raw.includedPictureIds),
    finalComment: str(raw.finalComment),
  };
}

/**
 * A blank narrative for a freshly generated report. Every note and picture in
 * the snapshot starts included — the teacher unticks the ones they don't want,
 * which is far less work than ticking each one.
 */
export function defaultNarrative(
  snapshot: ConferenceSnapshot,
): ConferenceNarrative {
  const development: Record<string, DevLevel | null> = {};
  for (const section of DEVELOPMENT_SECTIONS) {
    for (const item of section.items) {
      development[`${section.id}:${item.id}`] = null;
    }
  }
  const character: Record<string, number> = {};
  for (const trait of CHARACTER_TRAITS) character[trait] = 0;

  return {
    summary: "",
    strengths: [],
    areasForGrowth: [],
    areaComments: Object.fromEntries(snapshot.areas.map((a) => [a.areaId, ""])),
    development,
    developmentComments: Object.fromEntries(
      DEVELOPMENT_SECTIONS.map((s) => [s.id, ""]),
    ),
    character,
    includedNoteIds: snapshot.notes.map((n) => n.id),
    includedPictureIds: snapshot.pictures.map((p) => p.id),
    finalComment: "",
  };
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export const TERM_LABELS: Record<Term, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

/** "First Term · Mid-Term Report" — the one line that names a report. */
export function reportPeriodLabel(term: Term, kind: ReportKind): string {
  return `${TERM_LABELS[term]} · ${REPORT_KIND_LABELS[kind]}`;
}

/**
 * The date window for an academic year string like "2025-2026" — 1 September
 * through 31 August. Used for the "year to date" row of the attendance table.
 * Falls back to a calendar year when the string isn't in that shape.
 */
export function academicYearWindow(academicYear: string): {
  from: string;
  to: string;
} {
  const match = /^(\d{4})\s*[-/]\s*(\d{4})$/.exec(academicYear.trim());
  if (match) {
    return { from: `${match[1]}-09-01`, to: `${match[2]}-08-31` };
  }
  const single = /^(\d{4})$/.exec(academicYear.trim());
  if (single) return { from: `${single[1]}-01-01`, to: `${single[1]}-12-31` };
  const year = new Date().getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

/**
 * The academic year a date falls in, as "2026-2027": September starts a new
 * year. Matches academicYearWindow, so a report defaulted to it counts the
 * attendance recorded this year.
 */
export function academicYearFor(date: Date = new Date()): string {
  const y = date.getFullYear();
  return date.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

/**
 * How far back a freshly opened generate dialog looks: a whole term for the
 * end-of-term report, roughly its first half for the mid-term one.
 */
export const DEFAULT_PERIOD_DAYS: Record<ReportKind, number> = {
  termly: 70,
  midterm: 35,
};

/** "2016-10-01" -> "10/1/2016", matching the report's marking-period line. */
export function formatReportDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${Number(match[2])}/${Number(match[3])}/${match[1]}`;
}

/** Filename-safe slug for the downloaded PDF. */
export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "report"
  );
}
