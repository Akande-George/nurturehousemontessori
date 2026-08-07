import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  HeartPulse,
  GraduationCap,
  Sparkles,
  Phone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/context";
import { createClient } from "@/supabase/server";
import { getStudentById, getStudentMedications } from "@/lib/db/students";
import { getClassById } from "@/lib/db/classes";
import { MedicationsCard } from "./MedicationsCard";
import { EditParametersButton } from "./EditParametersButton";

type EmergencyContact = {
  name?: string;
  phone?: string;
  relationship?: string;
};

function readEmergencyContact(value: unknown): EmergencyContact | null {
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    return {
      name: typeof v.name === "string" ? v.name : undefined,
      phone: typeof v.phone === "string" ? v.phone : undefined,
      relationship:
        typeof v.relationship === "string" ? v.relationship : undefined,
    };
  }
  return null;
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { school } = await requireRole("admin");
  const { studentId } = await params;
  const supabase = await createClient();
  if (!supabase || !school) return null;

  const student = await getStudentById(supabase, studentId);

  if (!student || student.school_id !== school.id) {
    return (
      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Student not found
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              This student may have been removed or the link is incorrect.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/students">Back to Directory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [cls, medications] = await Promise.all([
    student.class_id ? getClassById(supabase, student.class_id) : null,
    getStudentMedications(supabase, student.id),
  ]);

  const emergency = readEmergencyContact(student.emergency_contact);
  const hasMedical =
    student.allergies.length > 0 ||
    (student.medical_notes ?? "").trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </Link>

      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl ${student.avatar_color} text-white flex items-center justify-center text-2xl font-serif shrink-0`}
        >
          {student.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-serif text-slate-900">{student.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {cls?.name ?? student.classroom ?? "Unassigned"}
            {student.age_group ? ` · ${student.age_group}` : ""}
          </p>
        </div>
        <div className="ml-auto">
          <EditParametersButton
            studentId={student.id}
            studentName={student.name}
            allergies={student.allergies}
            medicalNotes={student.medical_notes}
            emergency={emergency}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 mb-1">
              Class
            </p>
            <p className="text-base font-medium text-slate-900">
              {cls?.name ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 mb-1">
              Date of Birth
            </p>
            <p className="text-base font-medium text-slate-900">
              {student.date_of_birth ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 mb-1">
              Enrolled
            </p>
            <p className="text-base font-medium text-slate-900">
              {student.enrolled_at
                ? new Date(student.enrolled_at).toLocaleDateString()
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {hasMedical && (
        <Card className="border-2 border-rose-200 shadow-sm bg-rose-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-rose-900 text-base">
              <HeartPulse className="w-4 h-4 text-rose-600" /> Medical
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {student.allergies.length > 0 && (
              <p className="flex items-start gap-1.5 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                <span>
                  <span className="font-semibold">Allergies: </span>
                  {student.allergies.join(", ")}
                </span>
              </p>
            )}
            {(student.medical_notes ?? "").trim().length > 0 && (
              <p className="text-slate-700">
                <span className="font-semibold text-slate-900">Notes: </span>
                {student.medical_notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {emergency && (emergency.name || emergency.phone) && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="w-4 h-4 text-montessori-primary" /> Emergency
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {emergency.name && (
              <p className="font-medium text-slate-900">
                {emergency.name}
                {emergency.relationship && (
                  <span className="text-slate-500 font-normal ml-1.5 text-xs">
                    ({emergency.relationship})
                  </span>
                )}
              </p>
            )}
            {emergency.phone && (
              <p className="text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> {emergency.phone}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <MedicationsCard studentId={student.id} medications={medications} />

      {student.interests.length > 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-montessori-primary" /> Interests
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {student.interests.map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="bg-slate-100 text-slate-600 border-none"
              >
                {interest}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
