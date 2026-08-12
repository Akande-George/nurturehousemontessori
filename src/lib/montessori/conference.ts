// Payload types for the Montessori progress report (Transparent Classroom
// style conference report).
//
// A report row splits into three jsonb columns:
//   snapshot  -- auto-collected facts, frozen at generate, never edited
//   narrative -- everything the teacher types
//   sections  -- which sections appear on this report
//
// Client-safe: no `server-only`, no supabase imports. The read* helpers below
// never throw on malformed or legacy jsonb — same defensive style as
// `readTheme()` / `invoiceLineItems()` in src/lib/db/types.ts.

import type { CurriculumStatus, Term } from "@/lib/db/types";
import { CHARACTER_TRAITS } from "./character";
import { DEVELOPMENT_SECTIONS, type DevLevel } from "./development";
import type {
  LessonAreaGroup,
  LessonEntry,
  LessonSubcategoryBlock,
} from "./lessons";

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
  | "attendance"
  | "lessons"
  | "key"
  | "development"
  | "character"
  | "notes"
  | "pictures"
  | "narrative"
  | "cumulative"
  | "signature";

export type ConferenceSections = Record<ConferenceSectionKey, boolean>;

export const SECTION_LABELS: { key: ConferenceSectionKey; label: string }[] = [
  { key: "attendance", label: "Attendance summary" },
  { key: "lessons", label: "Lessons this period" },
  { key: "key", label: "Key to the levels" },
  { key: "development", label: "Developmental checklists" },
  { key: "character", label: "Character profile" },
  { key: "notes", label: "Observation notes" },
  { key: "pictures", label: "Photographs" },
  { key: "narrative", label: "Guide's summary" },
  { key: "cumulative", label: "Everything to date" },
  { key: "signature", label: "Comments & signature" },
];

export const DEFAULT_SECTIONS: ConferenceSections = {
  attendance: true,
  lessons: true,
  key: true,
  development: true,
  character: true,
  notes: true,
  pictures: true,
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
  term: Term;
  academicYear: string;
  periodStart: string;
  periodEnd: string;
  parentNames: string[];
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

export type ConferenceAttendance = {
  period: AttendanceTally;
  year: AttendanceTally;
};

export type ConferenceSnapshot = {
  version: 1;
  header: ConferenceHeader;
  areas: ConferenceAreaBlock[];
  cumulativeAreas: ConferenceAreaBlock[];
  notes: ConferenceNote[];
  pictures: ConferencePicture[];
  attendance: ConferenceAttendance;
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

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

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
            level: (["not_started", "introduced", "developing", "proficient"] as const).includes(
              lesson.level as CurriculumStatus,
            )
              ? (lesson.level as CurriculumStatus)
              : "introduced",
            practiceCount: num(lesson.practiceCount),
            lastPracticedOn: strOrNull(lesson.lastPracticedOn),
          })),
      })),
  }));
}

/** Returns null when the row has never been generated (empty `{}` snapshot). */
export function readSnapshot(value: unknown): ConferenceSnapshot | null {
  if (!isObj(value) || !isObj(value.header)) return null;
  const h = value.header;
  const attendance = isObj(value.attendance) ? value.attendance : {};
  return {
    version: 1,
    header: {
      schoolName: str(h.schoolName),
      schoolLogoUrl: strOrNull(h.schoolLogoUrl),
      childName: str(h.childName),
      avatarColor: str(h.avatarColor, "bg-slate-200"),
      ageAtEnd: strOrNull(h.ageAtEnd),
      birthday: strOrNull(h.birthday),
      classroom: strOrNull(h.classroom),
      teacherName: str(h.teacherName),
      term: (["first", "second", "third"] as const).includes(h.term as Term)
        ? (h.term as Term)
        : "first",
      academicYear: str(h.academicYear),
      periodStart: str(h.periodStart),
      periodEnd: str(h.periodEnd),
      parentNames: strArray(h.parentNames),
    },
    areas: readAreaBlocks(value.areas),
    cumulativeAreas: readAreaBlocks(value.cumulativeAreas),
    notes: (Array.isArray(value.notes) ? value.notes : []).filter(isObj).map((n) => ({
      id: str(n.id),
      date: str(n.date),
      areaId: strOrNull(n.areaId),
      areaName: strOrNull(n.areaName),
      activityName: strOrNull(n.activityName),
      content: str(n.content),
    })),
    pictures: (Array.isArray(value.pictures) ? value.pictures : [])
      .filter(isObj)
      .map((p) => ({
        id: str(p.id),
        imageUrl: str(p.imageUrl),
        caption: strOrNull(p.caption),
        date: str(p.date),
        areaName: strOrNull(p.areaName),
      })),
    attendance: {
      period: readTally(attendance.period),
      year: readTally(attendance.year),
    },
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
