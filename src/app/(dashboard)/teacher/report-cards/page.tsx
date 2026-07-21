import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getTeacherClasses } from "@/lib/db/classes";
import { getClassStudents } from "@/lib/db/students";
import { getStudentReportCards } from "@/lib/db/reportCards";
import type { ReportCard, Student } from "@/lib/db/types";
import { ReportCardsClient } from "./ReportCardsClient";

export default async function TeacherReportCardsPage() {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  const db = supabase!;
  const classes = await getTeacherClasses(db, user.id, school!.id);

  const studentsByClass: Record<string, Student[]> = {};
  const cardsByStudent: Record<string, ReportCard[]> = {};

  await Promise.all(
    classes.map(async (c) => {
      const students = await getClassStudents(db, c.id);
      studentsByClass[c.id] = students;
      await Promise.all(
        students.map(async (s) => {
          if (!cardsByStudent[s.id]) {
            cardsByStudent[s.id] = await getStudentReportCards(db, s.id);
          }
        }),
      );
    }),
  );

  return (
    <ReportCardsClient
      classes={classes}
      studentsByClass={studentsByClass}
      cardsByStudent={cardsByStudent}
    />
  );
}
