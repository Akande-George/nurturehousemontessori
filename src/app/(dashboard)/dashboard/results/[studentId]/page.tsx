import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentById } from "@/lib/db/students";
import {
  getStudentReportCards,
  getReportCardById,
  type ReportCardWithRows,
} from "@/lib/db/reportCards";
import { getClasses } from "@/lib/db/classes";
import { StudentReportClient } from "./StudentReportClient";

export default async function ReportCardPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { school } = await requireRole("admin");
  const { studentId } = await params;
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const student = await getStudentById(supabase, studentId);
  const summaries = student ? await getStudentReportCards(supabase, studentId) : [];
  const cards = (
    await Promise.all(
      summaries.map((c) => getReportCardById(supabase, c.id)),
    )
  ).filter(Boolean) as ReportCardWithRows[];

  if (!student || cards.length === 0) {
    return (
      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No report card found
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              {student
                ? "This student has no generated report cards yet."
                : "This student could not be found."}
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/results">Back to Results</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [classes, subjectsRes] = await Promise.all([
    getClasses(supabase, school.id),
    supabase.from("subjects").select("id, name").eq("school_id", school.id),
  ]);

  const classNames: Record<string, string> = {};
  for (const c of classes) classNames[c.id] = c.name;
  const subjectNames: Record<string, string> = {};
  for (const s of subjectsRes.data ?? []) subjectNames[s.id] = s.name;

  return (
    <StudentReportClient
      studentName={student.name}
      cards={cards}
      classNames={classNames}
      subjectNames={subjectNames}
    />
  );
}
