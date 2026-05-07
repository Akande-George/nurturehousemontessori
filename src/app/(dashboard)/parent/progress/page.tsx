"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, TrendingUp, Award, Lightbulb } from "lucide-react";
import {
  getRoleUser,
  getStudentProgress,
  getStudentsForParent,
  useDemoStore,
} from "@/lib/mock/demo-store";

export default function AcademicProgressPage() {
  useDemoStore();
  const parent = getRoleUser("parent");
  const children = getStudentsForParent(parent.id);

  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    children.length > 0 ? children[0].id : null,
  );

  const selectedChild = selectedChildId
    ? children.find((c) => c.id === selectedChildId)
    : null;
  const progressData = selectedChild
    ? getStudentProgress(selectedChild.id)
    : null;

  const averageScore = useMemo(() => {
    if (!progressData?.areas) return 0;
    const scores = progressData.areas.map((a: any) => a.score);
    return Math.round(
      scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
    );
  }, [progressData]);

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-slate-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50";
    if (score >= 60) return "bg-amber-50";
    return "bg-slate-50";
  };

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

      {selectedChild && progressData && (
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
                    <p
                      className={`text-2xl font-serif font-bold ${getScoreColor(averageScore)}`}
                    >
                      {averageScore}%
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor(averageScore)}`}
                  >
                    <TrendingUp
                      className={`w-6 h-6 ${getScoreColor(averageScore)}`}
                    />
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
                        <div
                          className={`text-3xl font-serif font-bold ${getScoreColor(area.score)}`}
                        >
                          {area.score}%
                        </div>
                        {getLevelBadge(area.level)}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          area.score >= 80
                            ? "bg-emerald-500"
                            : area.score >= 60
                              ? "bg-amber-500"
                              : "bg-slate-400"
                        }`}
                        style={{ width: `${area.score}%` }}
                      />
                    </div>

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
