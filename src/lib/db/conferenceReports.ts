import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { School, Student } from "./types";
import {
  academicYearWindow,
  readNarrative,
  readSections,
  readSnapshot,
  type ConferenceNarrative,
  type ConferenceSections,
  type ConferenceSnapshot,
} from "@/lib/montessori/conference";
import type { SnapshotInput } from "@/lib/montessori/conference-snapshot";
import {
  getStudentActivityPosts,
  getStudentCurriculumProgress,
  getStudentObservations,
} from "./montessori";
import { getStudentParentProfiles } from "./people";
import { getStudentAttendanceRange } from "./operations";

type DB = SupabaseClient<Database>;

export type ConferenceReportRow =
  Database["public"]["Tables"]["conference_reports"]["Row"];

/** A row with its three jsonb columns parsed. `snapshot` is null pre-generate. */
export type ConferenceReportFull = Omit<
  ConferenceReportRow,
  "snapshot" | "narrative" | "sections"
> & {
  snapshot: ConferenceSnapshot | null;
  narrative: ConferenceNarrative;
  sections: ConferenceSections;
};

function hydrate(row: ConferenceReportRow): ConferenceReportFull {
  const { snapshot, narrative, sections, ...rest } = row;
  return {
    ...rest,
    snapshot: readSnapshot(snapshot),
    narrative: readNarrative(narrative),
    sections: readSections(sections),
  };
}

export async function getSchoolConferenceReports(
  db: DB,
  schoolId: string,
): Promise<ConferenceReportRow[]> {
  const { data } = await db
    .from("conference_reports")
    .select("*")
    .eq("school_id", schoolId)
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function getStudentConferenceReports(
  db: DB,
  studentIds: string[],
): Promise<ConferenceReportRow[]> {
  if (studentIds.length === 0) return [];
  const { data } = await db
    .from("conference_reports")
    .select("*")
    .in("student_id", studentIds)
    .order("period_end", { ascending: false });
  return data ?? [];
}

export async function getConferenceReportById(
  db: DB,
  id: string,
): Promise<ConferenceReportFull | null> {
  const { data } = await db
    .from("conference_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? hydrate(data) : null;
}

/**
 * Gather everything `buildConferenceSnapshot` needs for one child. Reuses the
 * existing per-student readers; only attendance is filtered in SQL.
 */
export async function collectConferenceInputs(
  db: DB,
  args: {
    school: Pick<School, "name" | "logo_url">;
    student: Pick<
      Student,
      "id" | "name" | "avatar_color" | "date_of_birth" | "classroom"
    >;
    teacherName: string;
    term: SnapshotInput["term"];
    academicYear: string;
    periodStart: string;
    periodEnd: string;
  },
): Promise<SnapshotInput> {
  const year = academicYearWindow(args.academicYear);

  const [progressRows, observations, posts, parents, periodRows, yearRows] =
    await Promise.all([
      getStudentCurriculumProgress(db, args.student.id),
      getStudentObservations(db, args.student.id),
      getStudentActivityPosts(db, args.student.id),
      getStudentParentProfiles(db, args.student.id),
      getStudentAttendanceRange(
        db,
        args.student.id,
        args.periodStart,
        args.periodEnd,
      ),
      getStudentAttendanceRange(db, args.student.id, year.from, year.to),
    ]);

  return {
    school: { name: args.school.name, logo_url: args.school.logo_url },
    student: {
      name: args.student.name,
      avatar_color: args.student.avatar_color,
      date_of_birth: args.student.date_of_birth,
      classroom: args.student.classroom,
    },
    teacherName: args.teacherName,
    parentNames: parents.map((p) => p.full_name).filter(Boolean),
    term: args.term,
    academicYear: args.academicYear,
    periodStart: args.periodStart,
    periodEnd: args.periodEnd,
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
    attendancePeriod: periodRows.map((r) => ({ status: r.status })),
    attendanceYear: yearRows.map((r) => ({ status: r.status })),
  };
}
