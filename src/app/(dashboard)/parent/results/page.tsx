import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentsForParent } from "@/lib/db/students";
import { getStudentReportCards } from "@/lib/db/reportCards";
import type { ReportCard } from "@/lib/db/types";
import { ParentResultsClient } from "./ParentResultsClient";

export default async function ParentResultsPage() {
  const { user } = await requireRole("parent");
  const supabase = await createClient();
  const children = await getStudentsForParent(supabase!, user.id);

  const cardsByChild: Record<string, ReportCard[]> = {};
  await Promise.all(
    children.map(async (c) => {
      cardsByChild[c.id] = await getStudentReportCards(supabase!, c.id);
    }),
  );

  return <ParentResultsClient children={children} cardsByChild={cardsByChild} />;
}
