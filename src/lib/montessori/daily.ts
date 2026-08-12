// Payload types for the daily report — the same three-part split as the termly
// progress report (see ./conference.ts):
//   snapshot  -- auto-collected facts, frozen at generate, never edited
//   narrative -- everything the teacher types
//   sections  -- which sections appear on this report
//
// Client-safe: no `server-only`, no supabase imports. The read* helpers never
// throw on malformed or legacy jsonb.

import type { AttendanceStatus } from "@/lib/db/types";
import type { LessonAreaGroup } from "./lessons";

// ---------------------------------------------------------------------------
// Care logs
// ---------------------------------------------------------------------------

/** Matches daily_activity_logs.activity_type, written by /teacher/log. */
export const CARE_TYPES = ["meals", "nap", "hygiene", "temperature"] as const;
export type CareType = (typeof CARE_TYPES)[number];

export const CARE_LABELS: Record<CareType, string> = {
  meals: "Meals",
  nap: "Rest & Nap",
  hygiene: "Nappy & Toileting",
  temperature: "Temperature Checks",
};

/** Fever threshold in °C — also the trigger for the parent alert email. */
export const FEVER_THRESHOLD_C = 38;

export type TemperatureFlag = { label: string; className: string };

/** Single source of truth for how a recorded temperature is interpreted. */
export function temperatureFlag(celsius: number): TemperatureFlag | null {
  if (Number.isNaN(celsius)) return null;
  if (celsius >= FEVER_THRESHOLD_C) {
    return {
      label: "Fever — parents notified",
      className: "text-rose-700 bg-rose-50 border-rose-200",
    };
  }
  if (celsius >= 37.5) {
    return {
      label: "Slightly elevated — monitored",
      className: "text-amber-700 bg-amber-50 border-amber-200",
    };
  }
  if (celsius < 36.0) {
    return {
      label: "Low — kept warm and rechecked",
      className: "text-sky-700 bg-sky-50 border-sky-200",
    };
  }
  return null;
}

/** Pulls the numeric reading out of a stored value like "37.2°C". */
export function parseTemperature(value: string | null): number {
  if (!value) return NaN;
  return parseFloat(value.replace(/[^0-9.]/g, ""));
}

// ---------------------------------------------------------------------------
// Mood
// ---------------------------------------------------------------------------

export const MOOD_OPTIONS = [
  { value: "Happy", emoji: "😊" },
  { value: "Content", emoji: "🙂" },
  { value: "Calm", emoji: "😌" },
  { value: "Tired", emoji: "😴" },
  { value: "Unsettled", emoji: "😕" },
  { value: "Sad", emoji: "😢" },
] as const;

export function moodEmoji(mood: string | null): string {
  return MOOD_OPTIONS.find((m) => m.value === mood)?.emoji ?? "😐";
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Arrived late",
  excused: "Excused",
};

// ---------------------------------------------------------------------------
// Section toggles
// ---------------------------------------------------------------------------

export type DailySectionKey =
  | "attendance"
  | "mood"
  | "care"
  | "lessons"
  | "notes"
  | "pictures"
  | "summary"
  | "reminders";

export type DailySections = Record<DailySectionKey, boolean>;

export const DAILY_SECTION_LABELS: { key: DailySectionKey; label: string }[] = [
  { key: "attendance", label: "Attendance" },
  { key: "mood", label: "Mood" },
  { key: "care", label: "Care & routine" },
  { key: "lessons", label: "Work of the day" },
  { key: "notes", label: "Observations" },
  { key: "pictures", label: "Photographs" },
  { key: "summary", label: "Teacher's note" },
  { key: "reminders", label: "Reminders for home" },
];

export const DAILY_DEFAULT_SECTIONS: DailySections = {
  attendance: true,
  mood: true,
  care: true,
  lessons: true,
  notes: true,
  pictures: true,
  summary: true,
  reminders: true,
};

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

export type DailyHeader = {
  schoolName: string;
  schoolLogoUrl: string | null;
  childName: string;
  avatarColor: string;
  age: string | null;
  classroom: string | null;
  ageGroupLabel: string;
  teacherName: string;
  reportDate: string; // YYYY-MM-DD
  parentNames: string[];
};

export type DailyCareEntry = {
  id: string;
  time: string | null;
  value: string | null;
  notes: string | null;
  /** Only set for temperature readings outside the normal band. */
  flag: TemperatureFlag | null;
};

export type DailyCareGroup = {
  type: string;
  label: string;
  entries: DailyCareEntry[];
};

export type DailyNote = {
  id: string;
  time: string | null;
  areaId: string | null;
  areaName: string | null;
  activityName: string | null;
  content: string;
};

export type DailyPicture = {
  id: string;
  imageUrl: string;
  caption: string | null;
  areaName: string | null;
};

export type DailySnapshot = {
  version: 1;
  header: DailyHeader;
  attendance: { status: AttendanceStatus | null; notes: string | null };
  care: DailyCareGroup[];
  areas: LessonAreaGroup[];
  notes: DailyNote[];
  pictures: DailyPicture[];
};

// ---------------------------------------------------------------------------
// Narrative
// ---------------------------------------------------------------------------

export type DailyNarrative = {
  mood: string;
  summary: string;
  highlights: string[];
  reminders: string[];
  careComment: string;
  includedNoteIds: string[];
  includedPictureIds: string[];
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
const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

export function readDailySections(value: unknown): DailySections {
  const raw = isObj(value) ? value : {};
  const out = { ...DAILY_DEFAULT_SECTIONS };
  for (const key of Object.keys(DAILY_DEFAULT_SECTIONS) as DailySectionKey[]) {
    if (typeof raw[key] === "boolean") out[key] = raw[key];
  }
  return out;
}

function readAreaGroups(value: unknown): LessonAreaGroup[] {
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
            level: (
              ["not_started", "introduced", "developing", "proficient"] as const
            ).includes(lesson.level as never)
              ? (lesson.level as LessonAreaGroup["subcategories"][number]["lessons"][number]["level"])
              : "introduced",
            practiceCount: typeof lesson.practiceCount === "number" ? lesson.practiceCount : 0,
            lastPracticedOn: strOrNull(lesson.lastPracticedOn),
          })),
      })),
  }));
}

/** Returns null when the row has never been generated (empty `{}` snapshot). */
export function readDailySnapshot(value: unknown): DailySnapshot | null {
  if (!isObj(value) || !isObj(value.header)) return null;
  const h = value.header;
  const attendance = isObj(value.attendance) ? value.attendance : {};
  const attStatus = attendance.status;
  return {
    version: 1,
    header: {
      schoolName: str(h.schoolName),
      schoolLogoUrl: strOrNull(h.schoolLogoUrl),
      childName: str(h.childName),
      avatarColor: str(h.avatarColor, "bg-slate-200"),
      age: strOrNull(h.age),
      classroom: strOrNull(h.classroom),
      ageGroupLabel: str(h.ageGroupLabel),
      teacherName: str(h.teacherName),
      reportDate: str(h.reportDate),
      parentNames: strArray(h.parentNames),
    },
    attendance: {
      status: (["present", "absent", "late", "excused"] as const).includes(
        attStatus as AttendanceStatus,
      )
        ? (attStatus as AttendanceStatus)
        : null,
      notes: strOrNull(attendance.notes),
    },
    care: (Array.isArray(value.care) ? value.care : []).filter(isObj).map((g) => ({
      type: str(g.type),
      label: str(g.label),
      entries: (Array.isArray(g.entries) ? g.entries : [])
        .filter(isObj)
        .map((e) => ({
          id: str(e.id),
          time: strOrNull(e.time),
          value: strOrNull(e.value),
          notes: strOrNull(e.notes),
          flag: isObj(e.flag)
            ? { label: str(e.flag.label), className: str(e.flag.className) }
            : null,
        })),
    })),
    areas: readAreaGroups(value.areas),
    notes: (Array.isArray(value.notes) ? value.notes : []).filter(isObj).map((n) => ({
      id: str(n.id),
      time: strOrNull(n.time),
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
        areaName: strOrNull(p.areaName),
      })),
  };
}

export function readDailyNarrative(value: unknown): DailyNarrative {
  const raw = isObj(value) ? value : {};
  return {
    mood: str(raw.mood),
    summary: str(raw.summary),
    highlights: strArray(raw.highlights),
    reminders: strArray(raw.reminders),
    careComment: str(raw.careComment),
    includedNoteIds: strArray(raw.includedNoteIds),
    includedPictureIds: strArray(raw.includedPictureIds),
  };
}

/**
 * A blank narrative for a freshly generated report. Every observation and photo
 * starts included — the teacher unticks what they don't want, which is far less
 * work than ticking each one.
 */
export function defaultDailyNarrative(snapshot: DailySnapshot): DailyNarrative {
  return {
    mood: "",
    summary: "",
    highlights: [],
    reminders: [],
    careComment: "",
    includedNoteIds: snapshot.notes.map((n) => n.id),
    includedPictureIds: snapshot.pictures.map((p) => p.id),
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export const AGE_GROUP_LABELS: Record<string, string> = {
  infant_0_2: "0–3 years",
  primary_3_6: "3–6 years",
  lower_7_9: "6–9 years",
};

/** "2026-03-10" -> "Tuesday, 10 March 2026". */
export function formatLongDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
