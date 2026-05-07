"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit2,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  AlertTriangle,
  FileText,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getRoleUser,
  getStudentById,
  getTeacherStudents,
  useDemoStore,
} from "@/lib/mock/demo-store";

export default function StudentProfilePage() {
  useDemoStore();
  const params = useParams<{ studentId: string }>();
  const rawStudentId = decodeURIComponent(params?.studentId ?? "");
  const teacher = getRoleUser("teacher");
  const teacherStudents = getTeacherStudents(teacher.id);

  const student = useMemo(() => {
    const byId = getStudentById(rawStudentId);
    if (byId) return byId;

    if (/^\d+$/.test(rawStudentId)) {
      const index = Number(rawStudentId) - 1;
      if (index >= 0 && index < teacherStudents.length) {
        return teacherStudents[index];
      }
    }

    const normalized = rawStudentId.toLowerCase().trim();
    return (
      teacherStudents.find((s) => s.name.toLowerCase().startsWith(`${normalized} `)) ??
      null
    );
  }, [rawStudentId, teacherStudents]);

  const [activeTab, setActiveTab] = useState<
    "overview" | "health" | "documents"
  >("overview");

  if (!student) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-montessori-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
        <h1 className="text-xl font-serif text-slate-900">Student not found</h1>
      </div>
    );
  }

  const dob = new Date(student.dateOfBirth);
  const enrolled = new Date(student.enrollmentDate);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  const healthCondition = student.medicalNotes?.trim();
  const hasAlerts = student.allergies.length > 0 || Boolean(healthCondition);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Back Navigation */}
      <div className="mb-6">
        <Link
          href="/dashboard/students"
          className="text-sm font-medium text-slate-500 hover:text-montessori-primary flex items-center gap-1.5 mb-4 w-max transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-montessori-secondary/5 rounded-full blur-3xl -z-10" />

          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-serif text-3xl shadow-sm border-4 border-white">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-serif text-slate-900">
                  {student.name}
                </h1>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none rounded-full px-3">
                  Enrolled
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <UserCircle className="w-4 h-4" /> {student.ageGroup}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {student.classroom}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              asChild
              variant="outline"
              className="font-medium bg-white text-slate-700 shadow-sm hidden sm:flex"
            >
              <Link href="/dashboard/reports">View Daily Report</Link>
            </Button>
            <Button className="bg-montessori-primary text-white hover:bg-montessori-primary/90 shadow-sm gap-2 w-full sm:w-auto">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-6">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap min-w-[120px] ${activeTab === "overview" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <UserCircle className="w-5 h-5 shrink-0" /> General Info
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className={`flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap min-w-[120px] ${activeTab === "health" ? "bg-red-50 text-red-700" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <HeartPulse className="w-5 h-5 shrink-0" /> Health & Emergency
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap min-w-[120px] ${activeTab === "documents" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <FileText className="w-5 h-5 shrink-0" /> Forms & Documents
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                        Student ID
                      </p>
                      <p className="text-sm font-medium text-slate-900">{student.id}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                        Age
                      </p>
                      <p className="text-sm font-medium text-slate-900">{age} years</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                        Date of Birth
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {dob.toLocaleDateString("en-NG", {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
                        Enrollment Date
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {enrolled.toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-900 text-lg border-b border-slate-100 pb-2 mb-3">
                      Parent & Emergency Contact
                    </h3>
                    <Card className="border-slate-100 shadow-none">
                      <CardContent className="p-4 space-y-2">
                        <p className="text-sm font-medium text-slate-900">{student.emergencyContact.name}</p>
                        <p className="text-xs text-slate-500">{student.emergencyContact.relationship}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Phone className="w-4 h-4 text-slate-400" /> {student.emergencyContact.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Mail className="w-4 h-4 text-slate-400" /> {student.parentName}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-900 text-lg border-b border-slate-100 pb-2 mb-3">
                      Interests
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {student.interests.length > 0 ? (
                        student.interests.map((interest) => (
                          <Badge
                            key={interest}
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 border-none"
                          >
                            {interest}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No interests recorded yet.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "health" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Critical Alerts */}
              {hasAlerts && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-red-900 font-medium mb-2">
                      Critical Medical Alerts
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {student.allergies.map((allergy) => (
                        <Badge
                          key={allergy}
                          variant="secondary"
                          className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-medium"
                        >
                          Allergy: {allergy}
                        </Badge>
                      ))}
                      {healthCondition && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-medium"
                        >
                          Condition: {healthCondition}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contacts Grid */}
              <h3 className="font-medium text-slate-900 text-lg border-b border-slate-100 pb-2 mt-8 mb-4">
                Emergency Contacts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-100 shadow-sm border-montessori-primary/30 bg-montessori-primary/5">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-slate-900">{student.emergencyContact.name}</h4>
                        <p className="text-xs text-slate-500">{student.emergencyContact.relationship}</p>
                      </div>
                      <Badge className="bg-montessori-primary text-white border-none text-[10px]">
                        Primary
                      </Badge>
                    </div>
                    <div className="space-y-2 mt-4 text-sm">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" /> {student.emergencyContact.phone}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Medical Provider */}
              <h3 className="font-medium text-slate-900 text-lg border-b border-slate-100 pb-2 mt-8 mb-4">
                Medical Provider Information
              </h3>
              <Card className="border-slate-100 shadow-sm">
                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Provider Not Set
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                      Add provider details in student records.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="font-medium" disabled>
                    No Phone on File
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {[ 
                {
                  name: "Enrollment Record",
                  status: "complete",
                  updated: student.enrollmentDate,
                  note: "Initial enrollment and onboarding details.",
                },
                {
                  name: "Health & Allergy Form",
                  status: student.allergies.length > 0 || student.medicalNotes ? "complete" : "review",
                  updated: student.enrollmentDate,
                  note:
                    student.allergies.length > 0 || student.medicalNotes
                      ? "Allergy and medical information on file."
                      : "No medical concerns recorded yet.",
                },
                {
                  name: "Emergency Contact Authorization",
                  status: student.emergencyContact.phone ? "complete" : "pending",
                  updated: student.enrollmentDate,
                  note: `Emergency contact: ${student.emergencyContact.name} (${student.emergencyContact.relationship}).`,
                },
              ].map((doc) => (
                <Card key={doc.name} className="border-slate-100 shadow-sm">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{doc.note}</p>
                    </div>
                    <div className="sm:text-right">
                      <Badge
                        variant="secondary"
                        className={
                          doc.status === "complete"
                            ? "bg-emerald-100 text-emerald-700 border-none"
                            : doc.status === "review"
                              ? "bg-amber-100 text-amber-700 border-none"
                              : "bg-slate-100 text-slate-700 border-none"
                        }
                      >
                        {doc.status}
                      </Badge>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Updated {new Date(doc.updated).toLocaleDateString("en-NG")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
