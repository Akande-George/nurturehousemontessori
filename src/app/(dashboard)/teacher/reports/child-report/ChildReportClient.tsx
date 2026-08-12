"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Award,
  ArrowLeft,
  Calendar,
  Camera,
  FileText,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { CURRICULUM, getLeafById, type Leaf } from "@/lib/curriculum/curriculum";
import {
  getCurriculumStats,
  getLeavesByStatus,
  getMasteredLeaves,
  getRecentPresentations,
  touchedPercent,
  type ProgressMap,
} from "@/lib/curriculum/progress-utils";
import type { Student } from "@/lib/db/types";
import type { DailyReport, Progress } from "@/lib/db/montessori";

export type ReportPost = {
  id: string;
  caption: string | null;
  created_at: string;
  areaName: string | null;
  activityName: string | null;
};

type AcademicArea = { name?: string; level?: string; score?: number; trend?: string };
type Recommendation = { title?: string; description?: string };

const AGE_GROUP_LABEL: Record<string, string> = {
  infant_0_2: "0–3 years",
  primary_3_6: "3–6 years",
  lower_7_9: "6–9 years",
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
function formatTerm(term: string | null): string {
  if (!term) return "Current term";
  if (/first/i.test(term)) return "First Term";
  if (/second/i.test(term)) return "Second Term";
  if (/third/i.test(term)) return "Third Term";
  return term;
}

export function ChildReportClient({
  students,
  progressByStudent,
  academicByStudent,
  reportsByStudent,
  postsByStudent,
}: {
  students: Student[];
  progressByStudent: Record<string, ProgressMap>;
  academicByStudent: Record<string, Progress | null>;
  reportsByStudent: Record<string, DailyReport[]>;
  postsByStudent: Record<string, ReportPost[]>;
}) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(students[0]?.id ?? null);
  const selectedChild = selectedChildId ? students.find((c) => c.id === selectedChildId) ?? null : null;

  const progress = selectedChild ? progressByStudent[selectedChild.id] ?? {} : {};
  const academic = selectedChild ? academicByStudent[selectedChild.id] ?? null : null;
  const dailyReports = selectedChild ? reportsByStudent[selectedChild.id] ?? [] : [];
  const activities = selectedChild ? postsByStudent[selectedChild.id] ?? [] : [];

  const curriculumStats = getCurriculumStats(progress);
  const recentPractices = getRecentPresentations(progress, getLeafById, 8);
  const introduced = getLeavesByStatus(progress, "introduced");
  const developing = getLeavesByStatus(progress, "developing");
  const proficient = getMasteredLeaves(progress);

  // Plain calls, not useMemo: groupByArea is a single cheap pass, and manually
  // memoizing it made the React Compiler skip optimizing this whole component.
  const introducedByArea = groupByArea(introduced);
  const developingByArea = groupByArea(developing);
  const proficientByArea = groupByArea(proficient);

  const overallTouched =
    curriculumStats.overall.introduced + curriculumStats.overall.developing + curriculumStats.overall.proficient;
  const overallPct = touchedPercent(curriculumStats.overall);

  const academicAreas = (academic?.areas as AcademicArea[] | null) ?? [];
  const recommendations = (academic?.recommendations as Recommendation[] | null) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:space-y-8 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Child Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive teacher-side overview of each child in your class.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full md:w-auto">
          <Link href="/teacher" className="flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back to My Classroom
          </Link>
        </Button>
      </div>

      {students.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible print:hidden">
          {students.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                selectedChildId === child.id
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className={`w-5 h-5 rounded-full ${child.avatar_color} text-white flex items-center justify-center text-[10px] font-bold`}>
                {child.name[0]}
              </div>
              {child.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {selectedChild ? (
        <div>
          <div className="flex justify-end mb-4 print:hidden">
            <PrintButton label="Print Full Report" />
          </div>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-montessori-primary" />
                {selectedChild.name} — Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ProfileField label="Classroom" value={selectedChild.classroom ?? "—"} />
                <ProfileField
                  label="Age Group"
                  value={selectedChild.age_group ? AGE_GROUP_LABEL[selectedChild.age_group] ?? selectedChild.age_group : "—"}
                />
                <ProfileField
                  label="Enrolled"
                  value={
                    selectedChild.enrolled_at
                      ? new Date(selectedChild.enrolled_at).toLocaleDateString("en-NG", { month: "short", year: "numeric" })
                      : "—"
                  }
                />
                <ProfileField
                  label="D.O.B."
                  value={
                    selectedChild.date_of_birth
                      ? new Date(selectedChild.date_of_birth).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                      : "—"
                  }
                />
              </div>

              {selectedChild.interests.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedChild.interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                Curriculum Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-3xl font-serif text-slate-900">
                    {overallTouched}
                    <span className="text-base font-sans text-slate-400 font-normal"> / {curriculumStats.overall.total}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">activities introduced ({overallPct}%)</p>
                </div>
                <div className="flex gap-4 text-xs">
                  <StatusCount n={curriculumStats.overall.proficient} label="proficient" tone="text-emerald-700" />
                  <StatusCount n={curriculumStats.overall.developing} label="developing" tone="text-amber-700" />
                  <StatusCount n={curriculumStats.overall.introduced} label="introduced" tone="text-sky-700" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {CURRICULUM.map((area) => {
                  const s = curriculumStats.byArea[area.id];
                  const pct = touchedPercent(s);
                  return (
                    <div key={area.id} className={`rounded-lg p-3 border ${area.tone.border} ${area.tone.soft}`}>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold truncate">{area.name}</p>
                      <p className="text-base font-bold text-slate-900">{pct}%</p>
                      <div className="h-1.5 mt-1 rounded-full bg-white overflow-hidden">
                        <div className={`h-full ${area.tone.accent}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {s.proficient}P · {s.developing}D · {s.introduced}I
                      </p>
                    </div>
                  );
                })}
              </div>

              {recentPractices.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Recently practised
                  </p>
                  <ul className="space-y-2">
                    {recentPractices.map((entry, i) => (
                      <li key={`${entry.leafId}-${entry.sessionIndex}-${i}`} className="flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${entry.leaf.areaTone.accent}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-sm font-medium text-slate-900">
                              {entry.leaf.activityName}
                              {entry.leaf.leafName !== entry.leaf.activityName && (
                                <span className="text-slate-500 font-normal">{" · "}{entry.leaf.leafName}</span>
                              )}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] py-0 ${entry.leaf.areaTone.soft} ${entry.leaf.areaTone.text} ${entry.leaf.areaTone.border}`}
                            >
                              {entry.leaf.areaName}
                            </Badge>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                              {ordinal(entry.sessionIndex + 1)} practice
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(entry.date).toLocaleDateString("en-NG", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <LeafGallery
                title="Introduced"
                icon={<Sparkles className="w-3.5 h-3.5 text-sky-600" />}
                emptyText="No activities have been presented yet."
                byArea={introducedByArea}
                total={introduced.length}
              />
              <LeafGallery
                title="Developing"
                icon={<TrendingUp className="w-3.5 h-3.5 text-amber-600" />}
                emptyText="No activities are in active practice yet."
                byArea={developingByArea}
                total={developing.length}
              />
              <LeafGallery
                title="Proficient"
                icon={<Award className="w-3.5 h-3.5 text-emerald-600" />}
                emptyText="No activities marked proficient yet."
                byArea={proficientByArea}
                total={proficient.length}
              />
            </CardContent>
          </Card>

          {academic && (
            <Card className="border-slate-100 shadow-sm mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Academic Progress — {formatTerm(academic.term)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {academicAreas.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {academicAreas.map((area, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-slate-900 mb-2">{area.name ?? "Area"}</p>
                        {area.level && (
                          <Badge variant="outline" className="text-xs capitalize font-medium">
                            {area.level}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-1.5">Strengths</p>
                    <ul className="space-y-1 text-xs">
                      {academic.strengths.map((s, i) => (
                        <li key={i} className="text-slate-700">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold mb-1.5">Areas for growth</p>
                    <ul className="space-y-1 text-xs">
                      {academic.areas_for_growth.map((s, i) => (
                        <li key={i} className="text-slate-700">• {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {academic.teacher_comments && (
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900 mb-1">Teacher comments</p>
                    {academic.teacher_comments}
                  </div>
                )}
                {recommendations.length > 0 && (
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1.5">Recommendations</p>
                    <ul className="space-y-2 text-xs">
                      {recommendations.map((rec, i) => (
                        <li key={i} className="text-slate-700">
                          {rec.title && <strong className="text-montessori-primary">{rec.title}: </strong>}
                          {rec.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activities.length > 0 && (
            <Card className="border-slate-100 shadow-sm mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-rose-600" />
                  Recent Activity — {activities.length} post{activities.length !== 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.slice(0, 3).map((post) => (
                    <div key={post.id} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-slate-700">{post.caption}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(post.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        {post.areaName && (
                          <>
                            {" • "}
                            <span className="font-medium">
                              {post.areaName}
                              {post.activityName ? ` · ${post.activityName}` : ""}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {dailyReports.length > 0 && (
            <Card className="border-slate-100 shadow-sm mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Daily Reports — {dailyReports.length} report{dailyReports.length !== 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dailyReports.slice(0, 5).map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-col gap-3 rounded bg-slate-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <span className="text-slate-700">
                          {new Date(report.report_date).toLocaleDateString("en-NG", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {AGE_GROUP_LABEL[report.age_group] ?? report.age_group}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {report.general_mood === "Happy" ? "😊" : report.general_mood === "Sad" ? "😢" : "😐"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            report.status === "sent"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-dashed border-slate-200 shadow-none">
          <CardContent className="py-16 text-center text-sm text-slate-500">
            Select a student to view their report.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function groupByArea(leaves: Leaf[]): Record<string, Leaf[]> {
  const groups: Record<string, Leaf[]> = {};
  for (const leaf of leaves) {
    (groups[leaf.areaId] = groups[leaf.areaId] ?? []).push(leaf);
  }
  return groups;
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function StatusCount({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div>
      <p className={`font-semibold ${tone}`}>{n}</p>
      <p className="text-slate-500">{label}</p>
    </div>
  );
}

function LeafGallery({
  title,
  icon,
  emptyText,
  byArea,
  total,
}: {
  title: string;
  icon: React.ReactNode;
  emptyText: string;
  byArea: Record<string, Leaf[]>;
  total: number;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
        {icon}
        {title}
        <span className="ml-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {total}
        </span>
      </p>
      {total === 0 ? (
        <p className="text-xs text-slate-500 italic">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {CURRICULUM.map((area) => {
            const items = byArea[area.id];
            if (!items || items.length === 0) return null;
            return (
              <div key={area.id}>
                <p className={`text-[10px] uppercase tracking-wide font-semibold ${area.tone.text} mb-1`}>
                  {area.name} · {items.length}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((leaf) => (
                    <span
                      key={leaf.leafId}
                      className={`text-[11px] px-2 py-0.5 rounded-full border ${area.tone.soft} ${area.tone.text} ${area.tone.border}`}
                    >
                      {leaf.activityName}
                      {leaf.leafName !== leaf.activityName && (
                        <span className="opacity-60">{" · "}{leaf.leafName}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
