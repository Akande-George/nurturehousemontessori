"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext, requireRole } from "@/lib/auth/context";
import { linkParentToStudent } from "@/lib/server/link-parent";

type Result = { ok: boolean; error?: string };
type AgeGroup = "infant_0_2" | "primary_3_6" | "lower_7_9";

// Add a student directly (the admin-typed path, alongside enrolment acceptance).
// Optionally links a parent — creating their portal account + invite in one go.
export async function createStudent(input: {
  name: string;
  ageGroup?: AgeGroup;
  classroom?: string; // montessori
  classId?: string; // regular
  parentEmail?: string;
  parentName?: string;
}): Promise<{ ok: boolean; error?: string; warning?: string }> {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!school || !supabase) return { ok: false, error: "Not authorized" };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter the student's name." };

  const row: Record<string, unknown> = { school_id: school.id, name };
  if (input.ageGroup) row.age_group = input.ageGroup;
  if (school.type === "regular") {
    if (input.classId) row.class_id = input.classId;
  } else if (input.classroom?.trim()) {
    row.classroom = input.classroom.trim();
  }

  const { data: student, error } = await supabase
    .from("students")
    .insert(row)
    .select("id")
    .single();
  if (error || !student) {
    return { ok: false, error: error?.message ?? "Could not add the student." };
  }

  // Optional parent link + portal invite.
  if (input.parentEmail?.trim()) {
    const res = await linkParentToStudent({
      schoolId: school.id,
      schoolName: school.name,
      studentId: student.id,
      email: input.parentEmail,
      name: input.parentName,
    });
    if (!res.ok) {
      revalidatePath("/dashboard/students");
      return {
        ok: true,
        warning: `Student added, but the parent invite failed: ${res.error}`,
      };
    }
  }

  revalidatePath("/dashboard/students");
  return { ok: true };
}

// Medications are staff-managed (RLS allows admin/teacher writes; parents read).
export async function addMedication(input: {
  studentId: string;
  name: string;
  dosage?: string;
  time?: string;
  notes?: string;
}): Promise<Result> {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  const { error } = await supabase.from("student_medications").insert({
    student_id: input.studentId,
    name: input.name,
    dosage: input.dosage ?? null,
    time: input.time ?? null,
    notes: input.notes ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/students/${input.studentId}`);
  revalidatePath("/parent/parameters");
  return { ok: true };
}

export async function removeMedication(
  medicationId: string,
  studentId: string,
): Promise<Result> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const { error } = await supabase
    .from("student_medications")
    .delete()
    .eq("id", medicationId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/parent/parameters");
  return { ok: true };
}
