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
  type ReportKind,
} from "@/lib/montessori/conference";
import type { SnapshotInput } from "@/lib/montessori/conference-snapshot";
import {
  getStudentActivityPosts,
  getStudentCareLogsRange,
  getStudentCurriculumProgress,
  getStudentDailyReportsRange,
  getStudentObservations,
} from "./montessori";
import { getStudentParentProfiles } from "./people";
import {
  getStudentAttendanceRange,
  isStudentInAfterSchool,
} from "./operations";
import { getStudentMedications } from "./students";
import { getStudentChildMaterialsRange } from "./childMaterials";

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
 * Gather everything `buildConferenceSnapshot` needs for one child: the work
 * they did, the care they were given, the days they missed, the reports and
 * documents that went home, and the standing record held on them.
 *
 * Reuses the existing per-student readers; the rows that grow with every
 * school day (attendance, care logs, daily reports, materials) are filtered in
 * SQL to the marking period.
 */
export async function collectConferenceInputs(
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
      | "enrolled_at"
      | "allergies"
      | "interests"
      | "medical_notes"
      | "emergency_contact"
    >;
    teacherName: string;
    reportType: ReportKind;
    term: SnapshotInput["term"];
    academicYear: string;
    periodStart: string;
    periodEnd: string;
  },
): Promise<SnapshotInput> {
  // Year to date: from the start of the academic year up to the end of this
  // marking period (never past it), and never starting after the period does.
  const window = academicYearWindow(args.academicYear);
  const year = {
    from: window.from < args.periodStart ? window.from : args.periodStart,
    to: window.to < args.periodEnd ? window.to : args.periodEnd,
  };

  const [
    progressRows,
    observations,
    posts,
    parents,
    periodRows,
    yearRows,
    medications,
    afterSchoolCare,
    careLogs,
    dailyReports,
    materials,
  ] = await Promise.all([
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
    getStudentMedications(db, args.student.id),
    isStudentInAfterSchool(db, args.student.id),
    getStudentCareLogsRange(
      db,
      args.student.id,
      args.periodStart,
      args.periodEnd,
    ),
    getStudentDailyReportsRange(
      db,
      args.student.id,
      args.periodStart,
      args.periodEnd,
    ),
    getStudentChildMaterialsRange(
      db,
      args.student.id,
      args.periodStart,
      args.periodEnd,
    ),
  ]);

  return {
    school: { name: args.school.name, logo_url: args.school.logo_url },
    student: {
      name: args.student.name,
      avatar_color: args.student.avatar_color,
      date_of_birth: args.student.date_of_birth,
      classroom: args.student.classroom,
      age_group: args.student.age_group,
      enrolled_at: args.student.enrolled_at,
      allergies: args.student.allergies ?? [],
      interests: args.student.interests ?? [],
      medical_notes: args.student.medical_notes,
      emergency_contact: args.student.emergency_contact,
    },
    teacherName: args.teacherName,
    parentNames: parents.map((p) => p.full_name).filter(Boolean),
    reportType: args.reportType,
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
    attendancePeriod: periodRows.map((r) => ({
      date: r.date,
      status: r.status,
      notes: r.notes,
    })),
    attendanceYear: yearRows.map((r) => ({ status: r.status })),
    medications: medications.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      time: m.time,
      notes: m.notes,
    })),
    afterSchoolCare,
    careLogs: careLogs.map((l) => ({
      id: l.id,
      log_date: l.log_date,
      log_time: l.log_time,
      activity_type: l.activity_type,
      value: l.value,
      notes: l.notes,
    })),
    dailyReports: dailyReports.map((r) => ({
      id: r.id,
      report_date: r.report_date,
      general_mood: r.general_mood,
      status: r.status,
    })),
    materials: materials.map((m) => ({
      id: m.id,
      title: m.title,
      category: m.category,
      file_name: m.file_name,
      file_ext: m.file_ext,
      created_at: m.created_at,
    })),
  };
}
