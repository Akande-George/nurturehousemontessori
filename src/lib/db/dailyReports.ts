import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { School, Student } from "./types";
import {
  readDailyNarrative,
  readDailySections,
  readDailySnapshot,
  type DailyNarrative,
  type DailySections,
  type DailySnapshot,
} from "@/lib/montessori/daily";
import type {
  DailyActivityLogRow,
  DailySnapshotInput,
} from "@/lib/montessori/daily-snapshot";
import {
  getStudentActivityPosts,
  getStudentCurriculumProgress,
  getStudentObservations,
} from "./montessori";
import { getStudentParentProfiles } from "./people";

type DB = SupabaseClient<Database>;

export type DailyReportRow =
  Database["public"]["Tables"]["daily_reports"]["Row"];

/** A row with its three jsonb columns parsed. `snapshot` is null pre-generate. */
export type DailyReportFull = Omit<
  DailyReportRow,
  "snapshot" | "narrative" | "sections"
> & {
  snapshot: DailySnapshot | null;
  narrative: DailyNarrative;
  sections: DailySections;
};

function hydrate(row: DailyReportRow): DailyReportFull {
  const { snapshot, narrative, sections, ...rest } = row;
  return {
    ...rest,
    snapshot: readDailySnapshot(snapshot),
    narrative: readDailyNarrative(narrative),
    sections: readDailySections(sections),
  };
}

export async function getDailyReportFullById(
  db: DB,
  id: string,
): Promise<DailyReportFull | null> {
  const { data } = await db
    .from("daily_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? hydrate(data) : null;
}

/** Care logs for one child on one day. */
export async function getStudentActivityLogsForDate(
  db: DB,
  studentId: string,
  date: string,
): Promise<DailyActivityLogRow[]> {
  const { data } = await db
    .from("daily_activity_logs")
    .select("id, log_time, activity_type, value, notes, created_at")
    .eq("student_id", studentId)
    .eq("log_date", date)
    .order("log_time", { ascending: true });
  return (data ?? []) as DailyActivityLogRow[];
}

/**
 * Gather everything `buildDailySnapshot` needs for one child on one day.
 * Attendance and care logs are filtered in SQL; the rest reuses the existing
 * per-student readers.
 */
export async function collectDailyInputs(
  db: DB,
  args: {
    school: Pick<School, "name" | "logo_url">;
    student: Pick<
      Student,
      | "id"
      | "name"
      | "avatar_color"
      | "date_of_birth"
      | "classroom"
      | "age_group"
    >;
    teacherName: string;
    reportDate: string;
  },
): Promise<DailySnapshotInput> {
  const [progressRows, observations, posts, parents, activityLogs, attendance] =
    await Promise.all([
      getStudentCurriculumProgress(db, args.student.id),
      getStudentObservations(db, args.student.id),
      getStudentActivityPosts(db, args.student.id),
      getStudentParentProfiles(db, args.student.id),
      getStudentActivityLogsForDate(db, args.student.id, args.reportDate),
      db
        .from("attendance")
        .select("status, notes")
        .eq("student_id", args.student.id)
        .eq("date", args.reportDate)
        .maybeSingle(),
    ]);

  return {
    school: { name: args.school.name, logo_url: args.school.logo_url },
    student: {
      name: args.student.name,
      avatar_color: args.student.avatar_color,
      date_of_birth: args.student.date_of_birth,
      classroom: args.student.classroom,
      age_group: args.student.age_group,
    },
    teacherName: args.teacherName,
    parentNames: parents.map((p) => p.full_name).filter(Boolean),
    reportDate: args.reportDate,
    attendance: attendance.data
      ? {
          status: attendance.data.status,
          notes: attendance.data.notes ?? null,
        }
      : null,
    activityLogs,
    progressRows: progressRows.map((row) => ({
      leaf_id: row.leaf_id,
      status: row.status,
      updated_at: row.updated_at,
      practices: row.practices ?? [],
    })),
    observations: observations.map((o) => ({
      id: o.id,
      created_at: o.created_at,
      leaf_id: o.leaf_id,
      content: o.content,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      created_at: p.created_at,
      image_url: p.image_url,
      caption: p.caption,
      leaf_id: p.leaf_id,
    })),
  };
}
