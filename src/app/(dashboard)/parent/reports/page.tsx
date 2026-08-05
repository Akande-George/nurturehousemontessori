import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getStudentObservations, getStudentDailyReports } from "@/lib/db/montessori";
import { ParentReportsClient, type DayGroup } from "./ParentReportsClient";

export default async function DailyReportsPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  if (!supabase) return <ParentReportsClient children={[]} daysByChild={{}} />;

  const children = await getStudentsForParent(supabase, user.id);
  const [obsPerChild, dailyReports] = await Promise.all([
    Promise.all(children.map((c) => getStudentObservations(supabase, c.id))),
    getStudentDailyReports(supabase, children.map((c) => c.id)),
  ]);

  // Index any recorded mood/care by student + date, to show alongside the day's
  // observations.
  const careByKey = new Map<string, { mood: string | null; meals: string | null; nap: string | null }>();
  for (const r of dailyReports) {
    const content = (r.content ?? {}) as Record<string, unknown>;
    careByKey.set(`${r.student_id}:${r.report_date}`, {
      mood: r.general_mood,
      meals: typeof content.meals === "string" ? content.meals : null,
      nap: typeof content.nap === "string" ? content.nap : null,
    });
  }

  const daysByChild: Record<string, DayGroup[]> = {};
  children.forEach((c, i) => {
    const byDate = new Map<string, DayGroup>();
    for (const o of obsPerChild[i]) {
      const date = o.created_at.slice(0, 10);
      let day = byDate.get(date);
      if (!day) {
        const care = careByKey.get(`${c.id}:${date}`);
        day = {
          date,
          observations: [],
          mood: care?.mood ?? null,
          meals: care?.meals ?? null,
          nap: care?.nap ?? null,
        };
        byDate.set(date, day);
      }
      day.observations.push({
        id: o.id,
        areaName: o.leaf?.areaName ?? null,
        areaTone: o.leaf?.areaTone ?? null,
        activityName: o.leaf?.activityName ?? null,
        leafName: o.leaf?.leafName ?? null,
        content: o.content,
        time: o.created_at,
      });
    }
    daysByChild[c.id] = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
  });

  return (
    <ParentReportsClient
      children={children.map((c) => ({ id: c.id, name: c.name, avatar_color: c.avatar_color }))}
      daysByChild={daysByChild}
    />
  );
}
