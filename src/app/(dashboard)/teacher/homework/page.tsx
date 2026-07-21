import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import {
  getTeacherClasses,
  getTeacherSubjectsForClass,
  getSubjects,
} from "@/lib/db/classes";
import { getClassHomework } from "@/lib/db/homework";
import type { Homework, Subject } from "@/lib/db/types";
import { HomeworkClient } from "./HomeworkClient";

export default async function TeacherHomeworkPage() {
  const { user, school } = await requireRole("teacher");
  const supabase = await createClient();
  const db = supabase!;

  const [classes, subjects] = await Promise.all([
    getTeacherClasses(db, user.id, school!.id),
    getSubjects(db, school!.id),
  ]);

  const subjectsByClass: Record<string, Subject[]> = {};
  const homeworkByClass: Record<string, Homework[]> = {};

  await Promise.all(
    classes.map(async (c) => {
      const [taught, hw] = await Promise.all([
        getTeacherSubjectsForClass(db, user.id, c.id),
        getClassHomework(db, c.id),
      ]);
      subjectsByClass[c.id] = taught;
      homeworkByClass[c.id] = hw;
    }),
  );

  return (
    <HomeworkClient
      classes={classes}
      subjects={subjects}
      subjectsByClass={subjectsByClass}
      homeworkByClass={homeworkByClass}
    />
  );
}
