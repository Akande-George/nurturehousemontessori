"use client";

import { useState } from "react";
import Link from "next/link";
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

  const handleDownloadReport = (
    childData: DemoStudent,
    progress: DemoProgress | null,
  ) => {
    const age = calculateAge(childData.dateOfBirth);
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Child Report - ${childData.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px 60px;
      background: white;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .header {
      border-bottom: 3px solid #8b6f47;
      padding-bottom: 30px;
      margin-bottom: 40px;
      display: flex;
      justify-content: space-between;
      align-items: start;
    }
    .header-left h1 {
      font-size: 32px;
      color: #2d3748;
      margin-bottom: 5px;
      font-family: Georgia, serif;
    }
    .school-name {
      color: #8b6f47;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .report-date {
      color: #718096;
      font-size: 13px;
      margin-top: 10px;
    }
    .page-break {
      page-break-after: always;
      margin: 50px 0;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
      font-family: Georgia, serif;
    }
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .profile-item {
      background: #f7fafc;
      padding: 15px;
      border-radius: 6px;
    }
    .profile-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .profile-value {
      font-size: 16px;
      color: #2d3748;
      font-weight: 500;
    }
    .badge {
      display: inline-block;
      background: #e6fffa;
      color: #0d7377;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    .progress-section {
      margin-bottom: 30px;
    }
    .progress-area {
      background: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #8b6f47;
    }
    .progress-area-title {
      font-size: 16px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .score {
      font-size: 24px;
      font-weight: 700;
      color: #8b6f47;
    }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .progress-fill {
      height: 100%;
      background: #8b6f47;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .progress-description {
      font-size: 14px;
      color: #4a5568;
      margin-top: 10px;
      line-height: 1.5;
    }
    .list-items {
      list-style: none;
      padding: 0;
    }
    .list-items li {
      padding: 8px 0;
      border-bottom: 1px solid #edf2f7;
      padding-left: 20px;
      position: relative;
    }
    .list-items li:last-child {
      border-bottom: none;
    }
    .list-items li:before {
      content: '▪';
      position: absolute;
      left: 0;
      color: #8b6f47;
      font-weight: bold;
    }
    .comment-box {
      background: #fffaf0;
      border-left: 4px solid #ed8936;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #718096;
      text-align: center;
    }
    .signature-line {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #2d3748;
      margin-left: 0;
      width: 200px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: #f0fdf4;
      border: 1px solid #dcfce7;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
    }
    .summary-number {
      font-size: 28px;
      font-weight: 700;
      color: #22c55e;
    }
    .summary-label {
      font-size: 13px;
      color: #4b5563;
      margin-top: 5px;
    }
    @media print {
      body { padding: 20px; }
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="school-name">Nurture House Montessori</div>
        <h1>Child Report</h1>
        <div class="report-date">Generated: ${new Date().toLocaleDateString(
          "en-NG",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        )}</div>
      </div>
    </div>

    <!-- Profile Section -->
    <div class="section">
      <div class="section-title">Child Profile</div>
      <div class="profile-grid">
        <div class="profile-item">
          <div class="profile-label">Name</div>
          <div class="profile-value">${childData.name}</div>
        </div>
        <div class="profile-item">
          <div class="profile-label">Date of Birth</div>
          <div class="profile-value">${new Date(
            childData.dateOfBirth,
          ).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}</div>
        </div>
        <div class="profile-item">
          <div class="profile-label">Age</div>
          <div class="profile-value">${age} years old</div>
        </div>
        <div class="profile-item">
          <div class="profile-label">Age Group</div>
          <div class="profile-value">${getDisplayAgeBand(childData.ageGroup)}</div>
        </div>
        <div class="profile-item">
          <div class="profile-label">Classroom</div>
          <div class="profile-value">${childData.classroom}</div>
        </div>
        <div class="profile-item">
          <div class="profile-label">Enrollment Date</div>
          <div class="profile-value">${new Date(
            childData.enrollmentDate,
          ).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}</div>
        </div>
      </div>

      <!-- Interests -->
      <div class="profile-item">
        <div class="profile-label">Interests & Strengths</div>
        <div style="margin-top: 10px;">
          ${childData.interests.map((interest: string) => `<span class="badge">${interest}</span>`).join("")}
        </div>
      </div>

      <!-- Health & Safety -->
      ${
        childData.allergies.length > 0 || childData.medicalNotes
          ? `
      <div style="margin-top: 20px; background: #fff5f5; padding: 15px; border-radius: 6px; border-left: 4px solid #f56565;">
        <div class="profile-label" style="color: #c53030;">⚠ Health & Safety Information</div>
        ${
          childData.allergies.length > 0
            ? `<div style="margin-top: 10px;">
          <strong>Allergies:</strong> ${childData.allergies.join(", ")}
        </div>`
            : ""
        }
        ${
          childData.medicalNotes
            ? `<div style="margin-top: 10px;">
          <strong>Medical Notes:</strong> ${childData.medicalNotes}
        </div>`
            : ""
        }
      </div>
      `
          : ""
      }
    </div>

    <div class="page-break"></div>

    <!-- Academic Progress Section -->
    ${
      progress
        ? `
    <div class="section">
      <div class="section-title">Academic Progress Report</div>
      <div style="margin-bottom: 20px;">
        <div style="font-size: 14px; color: #4a5568; margin-bottom: 15px;">
          <strong>Term:</strong> ${progress.term} | <strong>Academic Year:</strong> ${progress.academicYear}
        </div>
      </div>

      <!-- Progress Areas -->
      ${progress.areas
        .map(
          (area: DemoProgressArea) => `
        <div class="progress-area">
          <div class="progress-area-title">
            <span>${area.name}</span>
            <span class="score">${area.score}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${area.score}%"></div>
          </div>
          <div style="font-size: 13px; color: #718096;">
            Level: <strong>${area.level.charAt(0).toUpperCase() + area.level.slice(1)}</strong>
          </div>
          <div class="progress-description">${area.description}</div>
          ${
            area.recentActivities && area.recentActivities.length > 0
              ? `
          <div style="margin-top: 12px; font-size: 13px;">
            <strong>Recent Activities:</strong>
            <ul class="list-items">
              ${area.recentActivities.map((activity: string) => `<li>${activity}</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }
        </div>
      `,
        )
        .join("")}

      <!-- Strengths -->
      <div class="progress-area" style="background: #e6fffa; border-left-color: #0d7377;">
        <div style="font-weight: 700; color: #0d7377; margin-bottom: 12px;">Key Strengths</div>
        <ul class="list-items">
          ${progress.strengths.map((strength: string) => `<li>${strength}</li>`).join("")}
        </ul>
      </div>

      <!-- Areas for Growth -->
      <div class="progress-area" style="background: #fef3c7; border-left-color: #d97706; margin-top: 15px;">
        <div style="font-weight: 700; color: #d97706; margin-bottom: 12px;">Areas for Growth</div>
        <ul class="list-items">
          ${progress.areasForGrowth.map((area: string) => `<li>${area}</li>`).join("")}
        </ul>
      </div>

      <!-- Teacher Comments -->
      <div class="comment-box">
        <strong>Teacher Comments:</strong>
        <div style="margin-top: 10px; line-height: 1.6;">${progress.teacherComments}</div>
        <div style="margin-top: 10px; font-size: 13px; color: #718096;">— ${progress.teacherName}</div>
      </div>

      <!-- Recommendations -->
      ${
        progress.recommendations && progress.recommendations.length > 0
          ? `
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin-top: 15px; border-radius: 4px;">
        <div style="font-weight: 700; color: #1e40af; margin-bottom: 12px;">Parent Recommendations</div>
        ${progress.recommendations
          .map(
            (rec: DemoProgress["recommendations"][number]) => `
          <div style="margin-bottom: 10px; font-size: 14px;">
            <strong>${rec.title}:</strong> ${rec.description}
          </div>
        `,
          )
          .join("")}
      </div>
      `
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- Daily Reports Section -->
    ${
      dailyReports.length > 0
        ? `
    <div class="section">
      <div class="section-title">Daily Reports Summary (${getDisplayAgeBand(childData.ageGroup)})</div>
      ${dailyReports
        .slice(0, 3)
        .map(
          (report: DemoDailyReport) => `
        <div class="progress-area" style="border-left-color: #3b82f6;">
          <div class="progress-area-title">
            <span>${new Date(report.date).toLocaleDateString("en-NG", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}</span>
            <span style="font-size: 13px; font-weight: 600; color: #1d4ed8;">${getDisplayAgeBand(report.ageGroup)}</span>
          </div>
          <div style="font-size: 14px; margin-bottom: 10px;">Mood: <strong>${report.generalMood}</strong></div>

          ${
            report.careEntries
              ? `
          <div style="font-size: 13px; color: #334155;">
            <strong>Care & Early Learning (0-3):</strong>
            <ul class="list-items">
              ${report.careEntries.map((entry: DemoDailyCareEntry) => `<li>${entry.label}: ${entry.value}</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }

          ${
            report.workCycle
              ? `
          <div style="font-size: 13px; color: #334155;">
            <strong>Work Cycle (3-6):</strong>
            <ul class="list-items">
              ${report.workCycle.map((work: DemoWorkEntry) => `<li>${work.area}: ${work.activity} (${work.level})</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }

          ${
            report.subjectProgress
              ? `
          <div style="font-size: 13px; color: #334155;">
            <strong>Subject Progress (6-9):</strong>
            <ul class="list-items">
              ${report.subjectProgress.map((subject: DemoSubjectEntry) => `<li>${subject.subject}: ${subject.activity}</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }

          <div style="margin-top: 10px; font-size: 13px; color: #475569;">
            <strong>Teacher Comment:</strong> ${report.teacherComments}
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
    `
        : ""
    }

    <div class="footer">
      <p>This report was generated on ${new Date().toLocaleDateString("en-NG")} for ${childData.parentName}</p>
      <p>Nurture House Montessori, Ilorin, Nigeria</p>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([reportHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Child-Report-${childData.name.replace(/\s+/g, "-")}-${new Date().getFullYear()}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
        <>
          {/* Download Button */}
          <div className="flex justify-stretch sm:justify-end">
            <button
              onClick={() => handleDownloadReport(selectedChild, progressData)}
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
                        <p className="text-2xl font-serif font-bold text-montessori-primary">
                          {area.score}%
                        </p>
                        <p className="text-xs text-slate-500 mt-2 capitalize">
                          {area.level}
                        </p>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
                          <div
                            className="h-full bg-montessori-primary rounded-full transition-all duration-300"
                            style={{ width: `${area.score}%` }}
                          />
                        </div>
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
                        <span className="font-medium">{post.category}</span>
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
        </>
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
