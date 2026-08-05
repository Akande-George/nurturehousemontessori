import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import {
  getStudentProgress,
  getStudentObservations,
  type Progress,
} from "@/lib/db/montessori";
import type { ObsLite } from "@/lib/montessori/term-summary";
import { ParentTermlyClient } from "./ParentTermlyClient";

export default async function ParentTermlyReportPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  if (!supabase) {
    return <ParentTermlyClient children={[]} reportByStudent={{}} obsByStudent={{}} />;
  }

  const children = await getStudentsForParent(supabase, user.id);
  const [reports, obs] = await Promise.all([
    Promise.all(children.map((c) => getStudentProgress(supabase, c.id))),
    Promise.all(children.map((c) => getStudentObservations(supabase, c.id))),
  ]);

  const reportByStudent: Record<string, Progress | null> = {};
  const obsByStudent: Record<string, ObsLite[]> = {};
  children.forEach((c, i) => {
    reportByStudent[c.id] = reports[i];
    obsByStudent[c.id] = obs[i].map((o) => ({
      areaName: o.leaf?.areaName ?? null,
      activityName: o.leaf?.activityName ?? null,
      leafName: o.leaf?.leafName ?? null,
      content: o.content,
      created_at: o.created_at,
    }));
  });

  return (
    <ParentTermlyClient
      children={children.map((c) => ({ id: c.id, name: c.name, avatar_color: c.avatar_color }))}
      reportByStudent={reportByStudent}
      obsByStudent={obsByStudent}
    />
  );
}
