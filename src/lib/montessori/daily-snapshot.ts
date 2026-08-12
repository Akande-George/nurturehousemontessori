// Assembles the frozen `snapshot` half of a daily report — everything the child
// did or took part in on one day.
//
// Pure by design: it takes already-fetched rows and returns the snapshot, so the
// day-window logic can be exercised without a database. Fetching lives in
// src/lib/db/dailyReports.ts.
//
// Same schema limitation as the progress report: curriculum_progress stores only
// a lesson's CURRENT status, so the level shown beside a lesson is its status at
// generate time. For a daily report generated on the day itself that is exactly
// right; back-dating a report can show a level the child only reached later.

import { getLeafById } from "@/lib/curriculum/curriculum";
import type { AttendanceStatus } from "@/lib/db/types";
import { groupIntoNonEmptyAreas, selectLessonsInWindow } from "./lessons";
import type { LessonProgressRow } from "./lessons";
import {
  AGE_GROUP_LABELS,
  CARE_LABELS,
  CARE_TYPES,
  parseTemperature,
  temperatureFlag,
  type CareType,
  type DailyCareGroup,
  type DailyNote,
  type DailyPicture,
  type DailySnapshot,
} from "./daily";
import { ageAt } from "./conference-snapshot";

export type DailyActivityLogRow = {
  id: string;
  log_time: string | null;
  activity_type: string;
  value: string | null;
  notes: string | null;
  created_at: string;
};

export type DailySnapshotInput = {
  school: { name: string; logo_url: string | null };
  student: {
    name: string;
    avatar_color: string;
    date_of_birth: string | null;
    classroom: string | null;
    age_group: string | null;
  };
  teacherName: string;
  parentNames: string[];
  reportDate: string; // YYYY-MM-DD
  attendance: { status: AttendanceStatus; notes: string | null } | null;
  activityLogs: DailyActivityLogRow[];
  progressRows: LessonProgressRow[];
  observations: {
    id: string;
    created_at: string;
    leaf_id: string;
    content: string;
  }[];
  posts: {
    id: string;
    created_at: string;
    image_url: string | null;
    caption: string | null;
    leaf_id: string | null;
  }[];
};

/** "14:05:00" -> "14:05"; anything unparseable passes through untouched. */
function tidyTime(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return value.trim() || null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

/** Sorts by clock time, with untimed entries last in insertion order. */
function byTime(a: { time: string | null }, b: { time: string | null }): number {
  if (a.time && b.time) return a.time.localeCompare(b.time);
  if (a.time) return -1;
  if (b.time) return 1;
  return 0;
}

function buildCareGroups(logs: DailyActivityLogRow[]): DailyCareGroup[] {
  const byType = new Map<string, DailyActivityLogRow[]>();
  for (const log of logs) {
    const list = byType.get(log.activity_type) ?? [];
    list.push(log);
    byType.set(log.activity_type, list);
  }

  // Known types first, in CARE_TYPES order; anything unrecognised follows so a
  // future activity_type still shows up rather than being silently dropped.
  const knownTypes: string[] = [...CARE_TYPES];
  const extraTypes = [...byType.keys()].filter((t) => !knownTypes.includes(t)).sort();

  return [...knownTypes, ...extraTypes]
    .map((type) => {
      const rows = byType.get(type) ?? [];
      return {
        type,
        label:
          CARE_LABELS[type as CareType] ??
          type.charAt(0).toUpperCase() + type.slice(1),
        entries: rows
          .map((log) => ({
            id: log.id,
            time: tidyTime(log.log_time),
            value: log.value,
            notes: log.notes,
            flag:
              type === "temperature"
                ? temperatureFlag(parseTemperature(log.value))
                : null,
          }))
          .sort(byTime),
      };
    })
    .filter((group) => group.entries.length > 0);
}

export function buildDailySnapshot(input: DailySnapshotInput): DailySnapshot {
  const { reportDate } = input;

  // Single-day window — same selection rules as the termly report.
  const lessons = selectLessonsInWindow(
    input.progressRows,
    reportDate,
    reportDate,
  );

  const fromTs = `${reportDate}T00:00:00.000Z`;
  const toTs = `${reportDate}T23:59:59.999Z`;

  const notes: DailyNote[] = input.observations
    .filter((o) => o.created_at >= fromTs && o.created_at <= toTs)
    .map((o) => {
      const leaf = getLeafById(o.leaf_id);
      return {
        id: o.id,
        time: tidyTime(o.created_at.slice(11, 16)),
        areaId: leaf?.areaId ?? null,
        areaName: leaf?.areaName ?? null,
        activityName: leaf?.activityName ?? null,
        content: o.content,
      };
    })
    .sort(byTime);

  const pictures: DailyPicture[] = input.posts
    .filter(
      (p) => !!p.image_url && p.created_at >= fromTs && p.created_at <= toTs,
    )
    .map((p) => ({
      id: p.id,
      imageUrl: p.image_url as string,
      caption: p.caption,
      areaName: p.leaf_id ? getLeafById(p.leaf_id)?.areaName ?? null : null,
    }));

  return {
    version: 1,
    header: {
      schoolName: input.school.name,
      schoolLogoUrl: input.school.logo_url,
      childName: input.student.name,
      avatarColor: input.student.avatar_color,
      age: ageAt(input.student.date_of_birth, reportDate),
      classroom: input.student.classroom,
      ageGroupLabel: input.student.age_group
        ? AGE_GROUP_LABELS[input.student.age_group] ?? input.student.age_group
        : "",
      teacherName: input.teacherName,
      reportDate,
      parentNames: input.parentNames,
    },
    attendance: {
      status: input.attendance?.status ?? null,
      notes: input.attendance?.notes ?? null,
    },
    care: buildCareGroups(input.activityLogs),
    areas: groupIntoNonEmptyAreas(lessons),
    notes,
    pictures,
  };
}
