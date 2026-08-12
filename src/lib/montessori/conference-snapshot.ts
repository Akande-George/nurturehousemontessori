// Assembles the frozen `snapshot` half of a progress report.
//
// Pure by design — it takes already-fetched rows and returns the snapshot, so
// the date-window logic can be exercised without a database. All fetching
// lives in src/lib/db/conferenceReports.ts.
//
// Known schema limitation: `curriculum_progress` stores only a lesson's
// CURRENT status plus one `updated_at`. There is no status-history table, so
// the level printed beside a lesson is its status at the moment the report was
// generated, not its status as of `periodEnd`. Freezing the result into
// `conference_reports.snapshot` means a generated report stays accurate
// forever; the generate dialog warns when `periodEnd` is well in the past.
//
// Minor: observations/posts carry `timestamptz` while practices and attendance
// are plain `date`, so a school far from UTC can see an edge-day item land on
// the neighbouring day.

import { getLeafById } from "@/lib/curriculum/curriculum";
import type { AttendanceStatus, CurriculumStatus, Term } from "@/lib/db/types";
import type {
  AttendanceTally,
  ConferenceNote,
  ConferencePicture,
  ConferenceSnapshot,
} from "./conference";
import {
  groupIntoAreas,
  selectAllLessons,
  selectLessonsInWindow,
} from "./lessons";

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

export type SnapshotInput = {
  school: { name: string; logo_url: string | null };
  student: {
    name: string;
    avatar_color: string;
    date_of_birth: string | null;
    classroom: string | null;
  };
  teacherName: string;
  parentNames: string[];
  term: Term;
  academicYear: string;
  periodStart: string; // YYYY-MM-DD, inclusive
  periodEnd: string; // YYYY-MM-DD, inclusive
  progressRows: SnapshotProgressRow[];
  observations: SnapshotObservation[];
  posts: SnapshotPost[];
  attendancePeriod: { status: AttendanceStatus }[];
  attendanceYear: { status: AttendanceStatus }[];
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

export function buildConferenceSnapshot(
  input: SnapshotInput,
): ConferenceSnapshot {
  const { periodStart, periodEnd } = input;

  // Lesson selection + grouping is shared with the daily report — see ./lessons.
  const periodLessons = selectLessonsInWindow(
    input.progressRows,
    periodStart,
    periodEnd,
  );
  const cumulativeLessons = selectAllLessons(input.progressRows);

  const fromTs = `${periodStart}T00:00:00.000Z`;
  const toTs = `${periodEnd}T23:59:59.999Z`;

  const notes: ConferenceNote[] = input.observations
    .filter((o) => o.created_at >= fromTs && o.created_at <= toTs)
    .map((o) => {
      const leaf = getLeafById(o.leaf_id);
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
      areaName: p.leaf_id ? getLeafById(p.leaf_id)?.areaName ?? null : null,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    version: 1,
    header: {
      schoolName: input.school.name,
      schoolLogoUrl: input.school.logo_url,
      childName: input.student.name,
      avatarColor: input.student.avatar_color,
      ageAtEnd: ageAt(input.student.date_of_birth, periodEnd),
      birthday: input.student.date_of_birth,
      classroom: input.student.classroom,
      teacherName: input.teacherName,
      term: input.term,
      academicYear: input.academicYear,
      periodStart,
      periodEnd,
      parentNames: input.parentNames,
    },
    areas: groupIntoAreas(periodLessons),
    cumulativeAreas: groupIntoAreas(cumulativeLessons),
    notes,
    pictures,
    attendance: {
      period: tally(input.attendancePeriod),
      year: tally(input.attendanceYear),
    },
  };
}
