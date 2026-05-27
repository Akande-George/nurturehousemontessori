"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Award,
  Lightbulb,
  Sparkles,
  Info,
} from "lucide-react";
import {
  getCurriculumStats,
  getMasteredLeaves,
  getRecentPresentations,
  getRoleUser,
  getStudentProgress,
  getStudentsForParent,
  getStudentObservations,
  useDemoStore,
} from "@/lib/mock/demo-store";
import { CURRICULUM } from "@/lib/curriculum/curriculum";

export default function AcademicProgressPage() {
  useDemoStore();
  const parent = getRoleUser("parent");
  const children = getStudentsForParent(parent.id);

  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    children.length > 0 ? children[0].id : null,
  );
  const [tab, setTab] = useState<"summary" | "journey">("journey");

  const selectedChild = selectedChildId
    ? children.find((c) => c.id === selectedChildId)
    : null;
  const progressData = selectedChild
    ? getStudentProgress(selectedChild.id)
    : null;

  const observations = selectedChild
    ? getStudentObservations(selectedChild.id)
    : [];

  // Group observations by area tag
  const obsByArea = useMemo(() => {
    const map: Record<string, typeof observations> = {};
    for (const obs of observations) {
      const key = obs.tag ?? "General";
      if (!map[key]) map[key] = [];
      map[key].push(obs);
    }
    return map;
  }, [observations]);

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUp className="w-4 h-4 text-emerald-600" />;
    if (trend === "down")
      return <ArrowDown className="w-4 h-4 text-amber-600" />;
    return <TrendingUp className="w-4 h-4 text-slate-400" />;
  };

  const getLevelBadge = (level: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> =
      {
        beginner: {
          bg: "bg-blue-50",
          text: "text-blue-700",
          label: "Beginner",
        },
        developing: {
          bg: "bg-amber-50",
          text: "text-amber-700",
          label: "Developing",
        },
        proficient: {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          label: "Proficient",
        },
        advanced: {
          bg: "bg-purple-50",
          text: "text-purple-700",
          label: "Advanced",
        },
      };
    const badge = badges[level] || badges.developing;
    return (
      <Badge
        variant="outline"
        className={`${badge.bg} ${badge.text} border-0 text-xs font-medium`}
      >
        {badge.label}
      </Badge>
    );
  };

  const getScoreColor = (_score: number) => "text-slate-700";
  const getScoreBgColor = (_score: number) => "bg-slate-50";

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-serif text-slate-900">
          Academic Progress
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track learning development across all subject areas.
        </p>
      </div>

      {/* Student selector */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                selectedChildId === child.id
                  ? "border-montessori-primary bg-montessori-primary/5 text-montessori-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full ${child.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}
              >
                {child.name[0]}
              </div>
              {child.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["journey", "summary"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t === "journey" ? "Curriculum Journey" : "Summary"}
          </button>
        ))}
      </div>

      {selectedChild && tab === "journey" && (
        <CurriculumJourney studentId={selectedChild.id} />
      )}

      {selectedChild && tab === "summary" && progressData && (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                      Overall Progress
                    </p>
                    <p className="text-2xl font-serif font-bold text-slate-900">
                      {progressData.areas.length} areas tracked
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-montessori-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                      Current Period
                    </p>
                    <p className="text-2xl font-serif font-bold text-slate-900">
                      {progressData.term}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {progressData.academicYear}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                      Key Strengths
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {progressData.strengths.length}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      areas of excellence
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Award className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Areas */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Subject Areas
            </h2>
            <div className="space-y-3">
              {progressData.areas.map((area: any) => (
                <Card
                  key={area.id}
                  className="border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900">
                            {area.name}
                          </h3>
                          {getTrendIcon(area.trend)}
                        </div>
                        <p className="text-sm text-slate-600">
                          {area.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {getLevelBadge(area.level)}
                        {getTrendIcon(area.trend)}
                      </div>
                    </div>

                    {/* Observations for this area */}
                    {obsByArea[area.name] &&
                      obsByArea[area.name].length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                            Observations
                          </p>
                          <ul className="space-y-2">
                            {obsByArea[area.name].map((obs) => (
                              <li
                                key={obs.id}
                                className="text-sm text-slate-700 flex items-start gap-2"
                              >
                                <span className="text-montessori-primary mt-0.5">
                                  ·
                                </span>
                                <div>
                                  <span>{obs.content}</span>
                                  <span className="ml-2 text-xs text-slate-400">
                                    —{" "}
                                    {new Date(
                                      obs.createdAt,
                                    ).toLocaleDateString("en-NG", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Details */}
                    {area.recentActivities &&
                      area.recentActivities.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                            Recent Activities
                          </p>
                          <ul className="space-y-1">
                            {area.recentActivities.map(
                              (activity: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-sm text-slate-700 flex items-start gap-2"
                                >
                                  <span className="text-montessori-primary mt-0.5">
                                    •
                                  </span>
                                  <span>{activity}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Strengths and Areas for Development */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {progressData.strengths.map((strength: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <span className="text-emerald-600 font-bold mt-0.5">
                        ✓
                      </span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                  Areas for Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {progressData.areasForGrowth.map(
                    (area: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <span className="text-amber-600 font-bold mt-0.5">
                          →
                        </span>
                        <span>{area}</span>
                      </li>
                    ),
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Teacher Comments */}
          {progressData.teacherComments && (
            <Card className="border-slate-100 shadow-sm bg-gradient-to-br from-slate-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Teacher Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {progressData.teacherComments}
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  — {progressData.teacherName}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {progressData.recommendations &&
            progressData.recommendations.length > 0 && (
              <Card className="border-slate-100 shadow-sm border-l-4 border-l-montessori-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Parent Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {progressData.recommendations.map((rec: any, i: number) => (
                      <li key={i} className="text-sm text-slate-700">
                        <strong className="text-montessori-primary">
                          {rec.title}:
                        </strong>{" "}
                        {rec.description}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Curriculum Journey — read-only view designed for non-Montessori-trained
// parents. Petal chart per area, recent presentations timeline, mastered
// gallery. Reads from the same demo-store progress data the teacher writes.
// ---------------------------------------------------------------------------

const SLOT_ORDINAL = ["1st", "2nd", "3rd"] as const;

function CurriculumJourney({ studentId }: { studentId: string }) {
  const stats = getCurriculumStats(studentId);
  const recent = getRecentPresentations(studentId, 8);
  const mastered = getMasteredLeaves(studentId);
  const [showHelp, setShowHelp] = useState(false);

  const overallPct =
    stats.overall.total === 0
      ? 0
      : Math.round(
          ((stats.overall.introduced +
            stats.overall.practicing +
            stats.overall.mastered) /
            stats.overall.total) *
            100,
        );

  // Group mastered leaves by area for the gallery
  const masteredByArea = useMemo(() => {
    const groups: Record<string, typeof mastered> = {};
    for (const leaf of mastered) {
      if (!groups[leaf.areaId]) groups[leaf.areaId] = [];
      groups[leaf.areaId].push(leaf);
    }
    return groups;
  }, [mastered]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Help banner */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="w-full flex items-start gap-2 text-left text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg px-3 py-2"
      >
        <Info className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
        <span>
          <span className="font-semibold">What does this mean?</span> In a
          Montessori classroom, each material is presented three times —
          introduction, practice, and mastery. {showHelp ? "Tap to hide." : "Tap to learn more."}
        </span>
      </button>
      {showHelp && (
        <Card className="border-slate-100 shadow-sm bg-gradient-to-br from-sky-50/40 to-white">
          <CardContent className="p-4 space-y-2 text-sm text-slate-700">
            <p>
              <strong>1st presentation</strong> — the guide introduces the
              material to your child for the first time. Your child watches
              and tries it under guidance.
            </p>
            <p>
              <strong>2nd presentation</strong> — your child returns to the
              material with growing independence. The guide observes and
              reinforces.
            </p>
            <p>
              <strong>3rd presentation</strong> — your child uses the material
              fluently and can teach a peer. We consider this "mastered" for
              that cycle of work.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Hero — overall journey */}
      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                Curriculum journey
              </p>
              <p className="text-3xl font-serif text-slate-900 mt-1">
                {stats.overall.introduced +
                  stats.overall.practicing +
                  stats.overall.mastered}{" "}
                <span className="text-base font-sans text-slate-500 font-normal">
                  of {stats.overall.total} Montessori activities experienced
                </span>
              </p>
              <p className="text-sm text-slate-500 mt-2">
                <span className="text-emerald-700 font-semibold">
                  {stats.overall.mastered}
                </span>{" "}
                mastered ·{" "}
                <span className="text-amber-700 font-semibold">
                  {stats.overall.practicing}
                </span>{" "}
                practicing ·{" "}
                <span className="text-sky-700 font-semibold">
                  {stats.overall.introduced}
                </span>{" "}
                just introduced
              </p>
            </div>
            <PetalChart stats={stats} overallPct={overallPct} />
          </div>
        </CardContent>
      </Card>

      {/* Recently introduced timeline */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Recently introduced
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              Your child's curriculum activity will appear here as their guide
              records presentations.
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.map((entry, i) => (
                <li key={`${entry.leafId}-${entry.slot}-${i}`} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${entry.leaf.areaTone.accent}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {entry.leaf.activityName}
                        {entry.leaf.leafName !== entry.leaf.activityName && (
                          <span className="text-slate-500 font-normal">
                            {" · "}
                            {entry.leaf.leafName}
                          </span>
                        )}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 ${entry.leaf.areaTone.soft} ${entry.leaf.areaTone.text} ${entry.leaf.areaTone.border}`}
                      >
                        {entry.leaf.areaName}
                      </Badge>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                        {SLOT_ORDINAL[entry.slot] ?? `#${entry.slot + 1}`}{" "}
                        presentation
                      </span>
                    </div>
                    {entry.leaf.description && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {entry.leaf.description}
                      </p>
                    )}
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
          )}
        </CardContent>
      </Card>

      {/* Mastered gallery */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-600" />
            Mastered
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mastered.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              No activities have been mastered yet — mastery takes patient
              repetition over weeks or months.
            </p>
          ) : (
            <div className="space-y-4">
              {CURRICULUM.map((area) => {
                const items = masteredByArea[area.id];
                if (!items || items.length === 0) return null;
                return (
                  <div key={area.id}>
                    <p
                      className={`text-[11px] uppercase tracking-wide font-semibold ${area.tone.text} mb-2`}
                    >
                      {area.name} · {items.length}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((leaf) => (
                        <span
                          key={leaf.leafId}
                          className={`text-xs px-2.5 py-1 rounded-full border ${area.tone.soft} ${area.tone.text} ${area.tone.border}`}
                        >
                          {leaf.activityName}
                          {leaf.leafName !== leaf.activityName && (
                            <span className="opacity-60">
                              {" · "}
                              {leaf.leafName}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PetalChart({
  stats,
  overallPct,
}: {
  stats: ReturnType<typeof getCurriculumStats>;
  overallPct: number;
}) {
  // Five petals arranged in a circle. Each petal's saturation indicates the
  // proportion of its area that's been introduced.
  const size = 180;
  const center = size / 2;
  const petalLength = 58;
  const petalWidth = 26;

  // Color hex map per area (tailwind-equivalent)
  const colorMap: Record<string, { light: string; dark: string }> = {
    emerald: { light: "#d1fae5", dark: "#10b981" },
    violet: { light: "#ede9fe", dark: "#8b5cf6" },
    sky: { light: "#e0f2fe", dark: "#0ea5e9" },
    amber: { light: "#fef3c7", dark: "#f59e0b" },
    pink: { light: "#fce7f3", dark: "#ec4899" },
  };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {CURRICULUM.map((area, i) => {
          const s = stats.byArea[area.id];
          const pct =
            s.total === 0
              ? 0
              : (s.introduced + s.practicing + s.mastered) / s.total;
          const masteredPct =
            s.total === 0 ? 0 : s.mastered / s.total;
          const angle = (i / CURRICULUM.length) * 2 * Math.PI - Math.PI / 2;
          const colors = colorMap[area.color] ?? colorMap.emerald;
          const tipX = center + Math.cos(angle) * petalLength;
          const tipY = center + Math.sin(angle) * petalLength;

          return (
            <g key={area.id}>
              {/* Background petal (light) */}
              <ellipse
                cx={tipX}
                cy={tipY}
                rx={petalWidth}
                ry={petalLength / 2}
                fill={colors.light}
                opacity={0.7}
                transform={`rotate(${(angle * 180) / Math.PI + 90} ${tipX} ${tipY})`}
              />
              {/* Foreground (filled by %) */}
              <ellipse
                cx={tipX}
                cy={tipY}
                rx={petalWidth * Math.max(pct, 0.05)}
                ry={(petalLength / 2) * Math.max(pct, 0.05)}
                fill={colors.dark}
                opacity={0.4 + masteredPct * 0.6}
                transform={`rotate(${(angle * 180) / Math.PI + 90} ${tipX} ${tipY})`}
              />
              {/* Label */}
              <text
                x={center + Math.cos(angle) * (petalLength + 18)}
                y={center + Math.sin(angle) * (petalLength + 18)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill="#64748b"
                fontWeight={600}
                style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                {area.name}
              </text>
            </g>
          );
        })}
        {/* Center dot */}
        <circle cx={center} cy={center} r={18} fill="#fff" stroke="#e2e8f0" />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="14"
          fontWeight={700}
          fill="#0c5c4c"
        >
          {overallPct}%
        </text>
      </svg>
    </div>
  );
}
