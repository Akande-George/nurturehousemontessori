// Assembles the frozen `snapshot` half of a progress report — the end-of-term
// report and the mid-term report are built by the same function over different
// dates.
//
// Pure by design — it takes already-fetched rows and returns the snapshot, so
// the date-window logic can be exercised without a database. All fetching
// lives in src/lib/db/conferenceReports.ts.
//
// The snapshot is meant to be exhaustive: everything the school recorded about
// this child inside the window ends up here (attendance day by day, care logs,
// daily reports, observations, photographs, lessons and the documents shared
// with home), plus the child's standing record. Sections the teacher doesn't
// want are switched off on the report, not left out of the snapshot, so
// switching one back on never needs a regenerate.
//
// Known schema limitation: `curriculum_progress` stores only a lesson's
// CURRENT status plus one `updated_at`. There is no status-history table, so
// the level printed beside a lesson is its status at the moment the report was
// generated, not its status as of `periodEnd`. Freezing the result into
// `conference_reports.snapshot` means a generated report stays accurate
// forever; the generate dialog warns when `periodEnd` is well in the past.
//
// Minor: observations/posts/materials carry `timestamptz` while practices,
// attendance and care logs are plain `date`, so a school far from UTC can see
// an edge-day item land on the neighbouring day.

import { CURRICULUM, getLeafById, type Area } from "@/lib/curriculum/curriculum";
import type { AttendanceStatus, CurriculumStatus, Term } from "@/lib/db/types";
import type {
  AttendanceDay,
  AttendanceTally,
  CareGroupSummary,
  ConferenceAreaBlock,
  ConferenceNote,
  ConferencePicture,
  ConferenceProfile,
  ConferenceSnapshot,
  DailyReportLog,
  ReportKind,
  SharedMaterial,
  WorkHighlights,
} from "./conference";
import {
  groupIntoAreas,
  selectAllLessons,
  selectLessonsInWindow,
  type LessonEntry,
} from "./lessons";
import { ageGroupLabel } from "./age-bands";
import {
  CARE_LABELS,
  CARE_TYPES,
  parseTemperature,
  temperatureFlag,
  type CareType,
} from "./daily";

/** At most this many entries of one care type print; the rest are counted. */
const MAX_CARE_ENTRIES = 40;
/** The most-practised lessons listed in the "work at a glance" band. */
const MAX_TOP_LESSONS = 8;

export type SnapshotProgressRow = {
  leaf_id: string;
  status: CurriculumStatus;
  updated_at: string;
  practices: { practiced_on: string }[];
};

export type SnapshotObservation = {
  id: string;
  created_at: string;
  leaf_id: string;
  content: string;
};

export type SnapshotPost = {
  id: string;
  created_at: string;
  image_url: string | null;
  caption: string | null;
  leaf_id: string | null;
};

export type SnapshotAttendanceRow = {
  date: string;
  status: AttendanceStatus;
  notes: string | null;
};

export type SnapshotCareLog = {
  id: string;
  log_date: string;
  log_time: string | null;
  activity_type: string;
  value: string | null;
  notes: string | null;
};

export type SnapshotDailyReport = {
  id: string;
  report_date: string;
  general_mood: string | null;
  status: string;
};

export type SnapshotMaterial = {
  id: string;
  title: string;
  category: string;
  file_name: string;
  file_ext: string;
  created_at: string;
};

export type SnapshotInput = {
  school: { name: string; logo_url: string | null };
  student: {
    name: string;
    avatar_color: string;
    date_of_birth: string | null;
    classroom: string | null;
    age_group: string | null;
    enrolled_at: string | null;
    allergies: string[];
    interests: string[];
    medical_notes: string | null;
    emergency_contact: unknown;
  };
  teacherName: string;
  parentNames: string[];
  reportType: ReportKind;
  term: Term;
  academicYear: string;
  periodStart: string; // YYYY-MM-DD, inclusive
  periodEnd: string; // YYYY-MM-DD, inclusive
  progressRows: SnapshotProgressRow[];
  observations: SnapshotObservation[];
  posts: SnapshotPost[];
  attendancePeriod: SnapshotAttendanceRow[];
  attendanceYear: { status: AttendanceStatus }[];
  medications: {
    name: string;
    dosage: string | null;
    time: string | null;
    notes: string | null;
  }[];
  afterSchoolCare: boolean;
  careLogs: SnapshotCareLog[];
  dailyReports: SnapshotDailyReport[];
  materials: SnapshotMaterial[];
  /**
   * The school's FULL curriculum catalog (getSchoolCurriculum(...).all), so
   * custom and renamed lessons report correctly. Defaults to the built-in album.
   */
  curriculum?: Area[];
};

const day = (iso: string) => iso.slice(0, 10);

/** "2021-03-14" on "2026-01-05" -> "4yr 9mo", matching the report header. */
export function ageAt(dob: string | null, onDate: string): string | null {
  if (!dob) return null;
  const birth = new Date(`${day(dob)}T00:00:00Z`);
  const at = new Date(`${day(onDate)}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(at.getTime())) return null;
  if (at < birth) return null;

  let years = at.getUTCFullYear() - birth.getUTCFullYear();
  let months = at.getUTCMonth() - birth.getUTCMonth();
  if (at.getUTCDate() < birth.getUTCDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years}yr ${months}mo`;
}

function tally(rows: { status: AttendanceStatus }[]): AttendanceTally {
  const out: AttendanceTally = {
    present: 0,
    absent: 0,
    tardy: 0,
    excused: 0,
    totalRecorded: rows.length,
  };
  for (const row of rows) {
    if (row.status === "present") out.present += 1;
    else if (row.status === "absent") out.absent += 1;
    else if (row.status === "late") out.tardy += 1;
    else if (row.status === "excused") out.excused += 1;
  }
  return out;
}

/** "14:05:00" -> "14:05"; anything unparseable passes through untouched. */
function tidyTime(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return value.trim() || null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

/** The child's standing record, as it reads on the day the report is generated. */
function buildProfile(input: SnapshotInput): ConferenceProfile {
  const raw = input.student.emergency_contact;
  const contact =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;
  const name = typeof contact?.name === "string" ? contact.name : "";

  return {
    ageGroupLabel: ageGroupLabel(input.student.age_group),
    enrolledAt: input.student.enrolled_at,
    allergies: input.student.allergies ?? [],
    interests: input.student.interests ?? [],
    medicalNotes: input.student.medical_notes,
    medications: input.medications,
    afterSchoolCare: input.afterSchoolCare,
    // A contact with no name is an empty jsonb stub, not a contact.
    emergencyContact: name
      ? {
          name,
          phone: typeof contact?.phone === "string" ? contact.phone : "",
          relationship:
            typeof contact?.relationship === "string"
              ? contact.relationship
              : "",
        }
      : null,
  };
}

/**
 * The period's work counted up. Lesson levels come from the same selection the
 * lesson lists use, so the band and the lists can never disagree.
 */
function buildHighlights(
  periodLessons: Map<string, LessonEntry>,
  areas: ConferenceAreaBlock[],
  notes: ConferenceNote[],
  pictures: ConferencePicture[],
  catalog: Area[],
): WorkHighlights {
  let introduced = 0;
  let developing = 0;
  let proficient = 0;
  let practiceSessions = 0;
  for (const lesson of periodLessons.values()) {
    if (lesson.level === "introduced") introduced += 1;
    else if (lesson.level === "developing") developing += 1;
    else if (lesson.level === "proficient") proficient += 1;
    practiceSessions += lesson.practiceCount;
  }

  const byArea = areas
    .map((area) => {
      const lessons = area.subcategories.flatMap((sub) => sub.lessons);
      return {
        areaId: area.areaId,
        areaName: area.areaName,
        lessons: lessons.length,
        practices: lessons.reduce((sum, l) => sum + l.practiceCount, 0),
      };
    })
    .filter((a) => a.lessons > 0);

  const topLessons = [...periodLessons.values()]
    .filter((l) => l.practiceCount > 0)
    .sort((a, b) => b.practiceCount - a.practiceCount)
    .slice(0, MAX_TOP_LESSONS)
    .map((l) => ({
      leafId: l.leafId,
      leafName: l.leafName,
      areaName: getLeafById(l.leafId, catalog)?.areaName ?? "",
      practiceCount: l.practiceCount,
      level: l.level,
    }));

  return {
    lessonsTouched: periodLessons.size,
    introduced,
    developing,
    proficient,
    practiceSessions,
    observationCount: notes.length,
    pictureCount: pictures.length,
    byArea,
    topLessons,
  };
}

/** Care logs grouped by type, in CARE_TYPES order, unknown types last. */
function buildCare(
  logs: SnapshotCareLog[],
  from: string,
  to: string,
): CareGroupSummary[] {
  const inWindow = logs.filter(
    (l) => day(l.log_date) >= from && day(l.log_date) <= to,
  );

  const byType = new Map<string, SnapshotCareLog[]>();
  for (const log of inWindow) {
    const list = byType.get(log.activity_type) ?? [];
    list.push(log);
    byType.set(log.activity_type, list);
  }

  const known: string[] = [...CARE_TYPES];
  const extra = [...byType.keys()].filter((t) => !known.includes(t)).sort();

  return [...known, ...extra]
    .map((type) => {
      const rows = (byType.get(type) ?? []).sort((a, b) => {
        const byDate = day(a.log_date).localeCompare(day(b.log_date));
        if (byDate !== 0) return byDate;
        return (a.log_time ?? "").localeCompare(b.log_time ?? "");
      });
      return {
        type,
        label:
          CARE_LABELS[type as CareType] ??
          type.charAt(0).toUpperCase() + type.slice(1),
        count: rows.length,
        truncated: Math.max(0, rows.length - MAX_CARE_ENTRIES),
        entries: rows.slice(0, MAX_CARE_ENTRIES).map((log) => ({
          id: log.id,
          date: day(log.log_date),
          time: tidyTime(log.log_time),
          value: log.value,
          notes: log.notes,
          flagLabel:
            log.activity_type === "temperature"
              ? temperatureFlag(parseTemperature(log.value))?.label ?? null
              : null,
        })),
      };
    })
    .filter((group) => group.count > 0);
}

/** Which daily reports went home in this period, and the mood they recorded. */
function buildDailyLog(
  reports: SnapshotDailyReport[],
  from: string,
  to: string,
): DailyReportLog {
  const inWindow = reports
    .filter((r) => day(r.report_date) >= from && day(r.report_date) <= to)
    .sort((a, b) => b.report_date.localeCompare(a.report_date));

  const moods = new Map<string, number>();
  for (const report of inWindow) {
    const mood = report.general_mood?.trim();
    if (mood) moods.set(mood, (moods.get(mood) ?? 0) + 1);
  }

  return {
    total: inWindow.length,
    sent: inWindow.filter((r) => r.status === "sent").length,
    entries: inWindow.map((r) => ({
      id: r.id,
      date: day(r.report_date),
      mood: r.general_mood?.trim() || null,
      sent: r.status === "sent",
    })),
    moodTally: [...moods.entries()]
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function buildMaterials(rows: SnapshotMaterial[]): SharedMaterial[] {
  return rows.map((m) => ({
    id: m.id,
    title: m.title,
    category: m.category,
    fileName: m.file_name,
    fileExt: m.file_ext,
    date: day(m.created_at),
  }));
}

export function buildConferenceSnapshot(
  input: SnapshotInput,
): ConferenceSnapshot {
  const { periodStart, periodEnd } = input;
  const catalog = input.curriculum ?? CURRICULUM;

  // Lesson selection + grouping is shared with the daily report — see ./lessons.
  const periodLessons = selectLessonsInWindow(
    input.progressRows,
    periodStart,
    periodEnd,
    catalog,
  );
  const cumulativeLessons = selectAllLessons(input.progressRows, catalog);

  const fromTs = `${periodStart}T00:00:00.000Z`;
  const toTs = `${periodEnd}T23:59:59.999Z`;

  const notes: ConferenceNote[] = input.observations
    .filter((o) => o.created_at >= fromTs && o.created_at <= toTs)
    .map((o) => {
      const leaf = getLeafById(o.leaf_id, catalog);
      return {
        id: o.id,
        date: day(o.created_at),
        areaId: leaf?.areaId ?? null,
        areaName: leaf?.areaName ?? null,
        activityName: leaf?.activityName ?? null,
        content: o.content,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const pictures: ConferencePicture[] = input.posts
    .filter(
      (p) => !!p.image_url && p.created_at >= fromTs && p.created_at <= toTs,
    )
    .map((p) => ({
      id: p.id,
      imageUrl: p.image_url as string,
      caption: p.caption,
      date: day(p.created_at),
      areaName: p.leaf_id ? getLeafById(p.leaf_id, catalog)?.areaName ?? null : null,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const areas = groupIntoAreas(periodLessons, catalog);

  // Only the exceptions are listed — a full present/absent grid for a term is
  // sixty near-identical rows, and the tally above already carries the count.
  const attendanceDays: AttendanceDay[] = input.attendancePeriod
    .filter((row) => row.status !== "present")
    .map((row) => ({
      date: day(row.date),
      status: row.status,
      notes: row.notes,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    version: 2,
    header: {
      schoolName: input.school.name,
      schoolLogoUrl: input.school.logo_url,
      childName: input.student.name,
      avatarColor: input.student.avatar_color,
      ageAtEnd: ageAt(input.student.date_of_birth, periodEnd),
      birthday: input.student.date_of_birth,
      classroom: input.student.classroom,
      teacherName: input.teacherName,
      reportType: input.reportType,
      term: input.term,
      academicYear: input.academicYear,
      periodStart,
      periodEnd,
      parentNames: input.parentNames,
    },
    profile: buildProfile(input),
    areas,
    cumulativeAreas: groupIntoAreas(cumulativeLessons, catalog),
    highlights: buildHighlights(periodLessons, areas, notes, pictures, catalog),
    notes,
    pictures,
    attendance: {
      period: tally(input.attendancePeriod),
      year: tally(input.attendanceYear),
      days: attendanceDays,
    },
    care: buildCare(input.careLogs, periodStart, periodEnd),
    dailyLog: buildDailyLog(input.dailyReports, periodStart, periodEnd),
    materials: buildMaterials(input.materials),
  };
}
