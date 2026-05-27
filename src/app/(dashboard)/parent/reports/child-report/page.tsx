"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { downloadHtmlAsPdf } from "@/lib/pdf/download-pdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Award,
  Calendar,
  AlertCircle,
  Camera,
} from "lucide-react";
import {
  type DemoDailyCareEntry,
  type DemoDailyReport,
  type DemoProgress,
  type DemoProgressArea,
  type DemoStudent,
  type DemoSubjectEntry,
  type DemoWorkEntry,
  getRoleUser,
  getStudentById,
  getStudentProgress,
  getStudentDailyReports,
  getActivityPostsForStudent,
  getStudentsForParent,
  useDemoStore,
} from "@/lib/mock/demo-store";

export default function ChildReportPage() {
  useDemoStore();
  const parent = getRoleUser("parent");
  const children = getStudentsForParent(parent.id);

  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    children.length > 0 ? children[0].id : null,
  );
  const reportRef = useRef<HTMLDivElement | null>(null);

  const selectedChild = selectedChildId
    ? getStudentById(selectedChildId)
    : null;
  const progressData = selectedChild
    ? getStudentProgress(selectedChild.id)
    : null;
  const dailyReports = selectedChild
    ? getStudentDailyReports(selectedChild.id)
    : [];
  const activities = selectedChild
    ? getActivityPostsForStudent(selectedChild.id)
    : [];

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getDisplayAgeBand = (ageGroup: string) => {
    if (ageGroup === "0-2 years") return "0-3 years";
    if (ageGroup === "7-9 years") return "6-9 years";
    return ageGroup;
  };

  const handleDownloadReport = async () => {
    const node = reportRef.current;
    if (!node || !selectedChild) return;
    await downloadHtmlAsPdf({
      element: node,
      filename: `Child-Report-${selectedChild.name.replace(/\s+/g, "-")}-${new Date().getFullYear()}.pdf`,
      pageBackground: "#ffffff",
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:space-y-8 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Child Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive overview and downloadable report for each child.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full md:w-auto"
        >
          <Link href="/parent/reports">← Back to Reports</Link>
        </Button>
      </div>

      {/* Student selector */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
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

      {selectedChild ? (
        <div ref={reportRef}>
          {/* Download Button */}
          <div className="flex justify-stretch sm:justify-end mb-4">
            <button
              data-pdf-exclude
              onClick={() => handleDownloadReport()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-montessori-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-montessori-primary/90 sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Download Full Report
            </button>
          </div>

          {/* Profile Overview */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-montessori-primary" />
                {selectedChild.name} — Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                    Classroom
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedChild.classroom}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                    Age Group
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedChild.ageGroup}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                    Enrolled
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(selectedChild.enrollmentDate).toLocaleDateString(
                      "en-NG",
                      {
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                    D.O.B.
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(selectedChild.dateOfBirth).toLocaleDateString(
                      "en-NG",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>

              {/* Interests */}
              {selectedChild.interests.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                    Interests
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedChild.interests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="outline"
                        className="bg-slate-50 text-slate-700 border-slate-200"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergies & Medical Notes */}
              {(selectedChild.allergies.length > 0 ||
                selectedChild.medicalNotes) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-amber-900">
                        Health & Safety Information
                      </p>
                      {selectedChild.allergies.length > 0 && (
                        <p className="text-sm text-amber-800 mt-2">
                          <strong>Allergies:</strong>{" "}
                          {selectedChild.allergies.join(", ")}
                        </p>
                      )}
                      {selectedChild.medicalNotes && (
                        <p className="text-sm text-amber-800 mt-1">
                          <strong>Medical Notes:</strong>{" "}
                          {selectedChild.medicalNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Academic Progress Summary */}
          {progressData && (
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Academic Progress — {progressData.term}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {progressData.areas
                    .slice(0, 3)
                    .map((area: DemoProgressArea) => (
                      <div key={area.id} className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-slate-900 mb-2">
                          {area.name}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs capitalize font-medium"
                        >
                          {area.level}
                        </Badge>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          {area.description}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          {activities.length > 0 && (
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-rose-600" />
                  Recent Activity — {activities.length} post
                  {activities.length !== 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.slice(0, 3).map((post) => (
                    <div key={post.id} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-slate-700">
                        {post.caption}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(post.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })}
                        {" • "}
                        <span className="font-medium">
                          {post.leaf.areaName} · {post.leaf.activityName}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Reports Summary */}
          {dailyReports.length > 0 && (
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Daily Reports — {dailyReports.length} report
                  {dailyReports.length !== 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                  Reports are rendered by age band: 0-3, 3-6, and 6-9.
                </div>

                <div className="space-y-2">
                  {dailyReports.slice(0, 5).map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-col gap-3 rounded bg-slate-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <span className="text-slate-700">
                          {new Date(report.date).toLocaleDateString("en-NG", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {getDisplayAgeBand(report.ageGroup)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {report.generalMood === "Happy"
                            ? "😊"
                            : report.generalMood === "Sad"
                              ? "😢"
                              : "😐"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            report.status === "sent"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : report.status === "generated"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
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
            Select a child to view their report.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
