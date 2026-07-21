import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getSchoolStudents } from "@/lib/db/students";
import {
  getSchoolDailyReports,
  getActivityFeed,
  getStudentCurriculumProgress,
  getStudentProgress,
  type DailyReport,
  type Progress,
} from "@/lib/db/montessori";
import { buildProgressMap, type ProgressMap } from "@/lib/curriculum/progress-utils";
import { ChildReportClient, type ReportPost } from "./ChildReportClient";

export default async function TeacherChildReportPage() {
  const { school } = await requireRole("teacher");
  const supabase = await createClient();
  if (!supabase || !school) {
    return (
      <ChildReportClient
        students={[]}
        progressByStudent={{}}
        academicByStudent={{}}
        reportsByStudent={{}}
        postsByStudent={{}}
      />
    );
  }

  const students = await getSchoolStudents(supabase, school.id);
  const ids = students.map((s) => s.id);

  const [progressRows, academicRows, dailyReports, feed] = await Promise.all([
    Promise.all(students.map((s) => getStudentCurriculumProgress(supabase, s.id))),
    Promise.all(students.map((s) => getStudentProgress(supabase, s.id))),
    getSchoolDailyReports(supabase, school.id),
    getActivityFeed(supabase, ids, null),
  ]);

  const progressByStudent: Record<string, ProgressMap> = {};
  const academicByStudent: Record<string, Progress | null> = {};
  students.forEach((s, i) => {
    progressByStudent[s.id] = buildProgressMap(progressRows[i]);
    academicByStudent[s.id] = academicRows[i];
  });

  const reportsByStudent: Record<string, DailyReport[]> = {};
  for (const r of dailyReports) {
    (reportsByStudent[r.student_id] = reportsByStudent[r.student_id] ?? []).push(r);
  }

  const postsByStudent: Record<string, ReportPost[]> = {};
  for (const p of feed) {
    (postsByStudent[p.student_id] = postsByStudent[p.student_id] ?? []).push({
      id: p.id,
      caption: p.caption,
      created_at: p.created_at,
      areaName: p.leaf?.areaName ?? null,
      activityName: p.leaf?.activityName ?? null,
    });
  }

  return (
    <ChildReportClient
      students={students}
      progressByStudent={progressByStudent}
      academicByStudent={academicByStudent}
      reportsByStudent={reportsByStudent}
      postsByStudent={postsByStudent}
    />
  );
}
