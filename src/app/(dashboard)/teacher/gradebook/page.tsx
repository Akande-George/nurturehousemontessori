import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import {
  getTeacherClasses,
  getTeacherSubjectsForClass,
} from "@/lib/db/classes";
import { getClassStudents } from "@/lib/db/students";
import { getClassScores } from "@/lib/db/scores";
import type {
  AssessmentScore,
  Student,
  Subject,
  Term,
} from "@/lib/db/types";
import { GradebookClient } from "./GradebookClient";

const TERMS: Term[] = ["first", "second", "third"];

export default async function TeacherGradebookPage() {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  const db = supabase!;
  const classes = await getTeacherClasses(db, user.id, school!.id);

  const subjectsByClass: Record<string, Subject[]> = {};
  const studentsByClass: Record<string, Student[]> = {};
  const scoresByKey: Record<string, AssessmentScore[]> = {};

  await Promise.all(
    classes.map(async (c) => {
      const [subjects, students] = await Promise.all([
        getTeacherSubjectsForClass(db, user.id, c.id),
        getClassStudents(db, c.id),
      ]);
      subjectsByClass[c.id] = subjects;
      studentsByClass[c.id] = students;
      await Promise.all(
        subjects.map((s) =>
          Promise.all(
            TERMS.map(async (t) => {
              scoresByKey[`${c.id}:${s.id}:${t}`] = await getClassScores(
                db,
                c.id,
                s.id,
                t,
              );
            }),
          ),
        ),
      );
    }),
  );

  return (
    <GradebookClient
      classes={classes}
      subjectsByClass={subjectsByClass}
      studentsByClass={studentsByClass}
      scoresByKey={scoresByKey}
    />
  );
}
