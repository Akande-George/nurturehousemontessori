"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin";
import { getActiveContext, requireRole } from "@/lib/auth/context";
import { linkParentToStudent } from "@/lib/server/link-parent";
import { placeByAge } from "@/lib/db/placement";
import {
  ageBandFor,
  ageInMonths,
  isAgeBand,
  roomForAge,
  type AgeGroup,
} from "@/lib/montessori/age-bands";

type Result = { ok: boolean; error?: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// "" -> null; otherwise a YYYY-MM-DD date, or an error message.
function parseDate(
  value: string | null | undefined,
  label: string,
  { notFuture = false } = {},
): { value: string | null; error?: string } {
  const v = value?.trim();
  if (!v) return { value: null };
  if (!ISO_DATE.test(v) || Number.isNaN(Date.parse(v))) {
    return { value: null, error: `${label} isn't a valid date.` };
  }
  if (notFuture && v > new Date().toISOString().slice(0, 10)) {
    return { value: null, error: `${label} can't be in the future.` };
  }
  return { value: v };
}

type ParamsInput = {
  studentId: string;
  allergies: string[];
  medicalNotes?: string;
  emergencyContact: { name?: string; phone?: string; relationship?: string };
};

function normalizeEmergency(ec: ParamsInput["emergencyContact"]) {
  return ec.name?.trim() || ec.phone?.trim() || ec.relationship?.trim()
    ? {
        name: ec.name?.trim() || "",
        phone: ec.phone?.trim() || "",
        relationship: ec.relationship?.trim() || "",
      }
    : null;
}

// Parent edits their OWN child's parameters. Parents are read-only on `students`
// under RLS, so we verify parentage then write with the service-role client —
// scoped to the three safe fields only (never class, name, etc.).
export async function updateChildParameters(input: ParamsInput): Promise<Result> {
  const ctx = await getActiveContext();
  if (!ctx || ctx.role !== "parent") return { ok: false, error: "Not authorized" };

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("student_parents")
    .select("id")
    .eq("student_id", input.studentId)
    .eq("parent_id", ctx.user.id)
    .maybeSingle();
  if (!link) return { ok: false, error: "This isn't one of your children." };

  const { error } = await admin
    .from("students")
    .update({
      allergies: input.allergies,
      medical_notes: input.medicalNotes?.trim() || null,
      emergency_contact: normalizeEmergency(input.emergencyContact),
    })
    .eq("id", input.studentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parent/parameters");
  revalidatePath(`/dashboard/students/${input.studentId}`);
  return { ok: true };
}

// Add a student directly (the admin-typed path, alongside enrolment acceptance).
// Optionally links one or more parents — creating each portal account + invite.
export async function createStudent(input: {
  name: string;
  ageGroup?: AgeGroup;
  dateOfBirth?: string;
  enrolledAt?: string;
  classroom?: string; // montessori
  classId?: string; // regular
  parents?: { email: string; name?: string }[];
}): Promise<{ ok: boolean; error?: string; warning?: string }> {
  const { school } = await requireRole("admin");
  const supabase = await createClient();
  if (!school || !supabase) return { ok: false, error: "Not authorized" };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter the student's name." };

  // Only the five current bands are accepted for new students; the retired
  // 0–2 band exists solely on older records.
  if (input.ageGroup && !isAgeBand(input.ageGroup)) {
    return { ok: false, error: "Choose one of the five age bands." };
  }

  const dob = parseDate(input.dateOfBirth, "Date of birth", { notFuture: true });
  if (dob.error) return { ok: false, error: dob.error };
  const enrolled = parseDate(input.enrolledAt, "Enrolment date");
  if (enrolled.error) return { ok: false, error: enrolled.error };

  const row: Record<string, unknown> = { school_id: school.id, name };
  if (input.ageGroup) row.age_group = input.ageGroup;
  if (dob.value) {
    row.date_of_birth = dob.value;
    // The age band follows the date of birth whenever there is one.
    row.age_group = ageBandFor(ageInMonths(dob.value) ?? 0);
  }
  if (enrolled.value) row.enrolled_at = enrolled.value;
  if (school.type === "regular") {
    if (input.classId) row.class_id = input.classId;
  } else if (input.classroom?.trim()) {
    const classroom = input.classroom.trim();
    row.classroom = classroom;
    // Keep the classroom list in step: a room typed in here (only possible
    // before the school has any) becomes a real, editable classroom.
    const { error: roomErr } = await supabase
      .from("classrooms")
      .upsert(
        { school_id: school.id, name: classroom },
        { onConflict: "school_id,name", ignoreDuplicates: true },
      );
    if (!roomErr) revalidatePath("/dashboard/classrooms");
  }

  const { data: student, error } = await supabase
    .from("students")
    .insert(row)
    .select("id")
    .single();
  if (error || !student) {
    return { ok: false, error: error?.message ?? "Could not add the student." };
  }

  // A date of birth places the child in the room for their age, unless the
  // admin picked a room themselves. A picked room that goes against their age
  // pins them there (as moveStudentToClassroom does) so the daily age-up
  // doesn't undo the choice. Best-effort: no pin column before the migration.
  if (school.type !== "regular" && dob.value) {
    const picked = input.classroom?.trim();
    if (!picked) {
      await placeByAge(supabase, { studentId: student.id });
    } else {
      const { data: rooms } = await supabase
        .from("classrooms")
        .select("*")
        .eq("school_id", school.id);
      const fits = roomForAge(rooms ?? [], ageInMonths(dob.value) ?? 0);
      if (fits && fits.name !== picked) {
        await supabase
          .from("students")
          .update({ classroom_pinned: true })
          .eq("id", student.id);
      }
    }
  }

  // Optional parent links + portal invites (a child may have several parents).
  const failed: string[] = [];
  for (const p of input.parents ?? []) {
    if (!p.email.trim()) continue;
    const res = await linkParentToStudent({
      schoolId: school.id,
      schoolName: school.name,
      studentId: student.id,
      email: p.email,
      name: p.name,
    });
    if (!res.ok) failed.push(`${p.email.trim()} (${res.error})`);
  }
  if (failed.length) {
    revalidatePath("/dashboard/students");
    return {
      ok: true,
      warning: `Student added, but the parent invite failed for ${failed.join(", ")}`,
    };
  }

  revalidatePath("/dashboard/students");
  return { ok: true };
}

// Move a Montessori child to another classroom, or take them out of one
// (classroom = null). The room must be one the school maintains, so a child
// can never land in a room the Classrooms screen doesn't show.
export async function moveStudentToClassroom(
  studentId: string,
  classroom: string | null,
): Promise<Result & { pinned?: boolean }> {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx || ctx.role !== "admin" || !ctx.school || !supabase) {
    return { ok: false, error: "Not authorized" };
  }
  const schoolId = ctx.school.id;

  const name = classroom?.trim() || null;
  if (name) {
    const { data: room } = await supabase
      .from("classrooms")
      .select("id")
      .eq("school_id", schoolId)
      .eq("name", name)
      .maybeSingle();
    if (!room) return { ok: false, error: `There is no classroom called "${name}".` };
  }

  const { data: student } = await supabase
    .from("students")
    .select("date_of_birth")
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!student) return { ok: false, error: "Student not found." };

  // A move that goes against the child's age pins them there, so the automatic
  // age placement doesn't undo the admin's choice. A move into the room their
  // age already fits leaves them free to move up as they grow.
  let pinned = false;
  const months = student.date_of_birth ? ageInMonths(student.date_of_birth) : null;
  if (months != null) {
    const { data: rooms } = await supabase
      .from("classrooms")
      .select("*")
      .eq("school_id", schoolId);
    const fits = roomForAge(rooms ?? [], months);
    pinned = fits ? fits.name !== name : false;
  }

  let { error } = await supabase
    .from("students")
    .update({ classroom: name, classroom_pinned: pinned })
    .eq("id", studentId)
    .eq("school_id", schoolId);
  // Before the age-placement migration there is no pin column; move anyway.
  if (error && /classroom_pinned/.test(error.message)) {
    ({ error } = await supabase
      .from("students")
      .update({ classroom: name })
      .eq("id", studentId)
      .eq("school_id", schoolId));
  }
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/dashboard/classrooms");
  return { ok: true, pinned };
}

// Let automatic age placement manage this child again, and place them now.
export async function clearClassroomPin(studentId: string): Promise<Result> {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx || ctx.role !== "admin" || !ctx.school || !supabase) {
    return { ok: false, error: "Not authorized" };
  }
  const { error } = await supabase
    .from("students")
    .update({ classroom_pinned: false })
    .eq("id", studentId)
    .eq("school_id", ctx.school.id);
  if (error) return { ok: false, error: error.message };
  await placeByAge(supabase, { studentId });

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/dashboard/classrooms");
  return { ok: true };
}

// Edit a child's core details. Montessori children are re-placed by age when
// their date of birth changes; regular-school children can change class here.
export async function updateStudentDetails(input: {
  studentId: string;
  name: string;
  dateOfBirth?: string | null;
  enrolledAt?: string | null;
  classId?: string | null; // regular schools
}): Promise<Result> {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx || ctx.role !== "admin" || !ctx.school || !supabase) {
    return { ok: false, error: "Not authorized" };
  }
  const school = ctx.school;

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter the student's name." };
  const dob = parseDate(input.dateOfBirth, "Date of birth", { notFuture: true });
  if (dob.error) return { ok: false, error: dob.error };
  const enrolled = parseDate(input.enrolledAt, "Enrolment date");
  if (enrolled.error) return { ok: false, error: enrolled.error };

  const { data: current } = await supabase
    .from("students")
    .select("date_of_birth")
    .eq("id", input.studentId)
    .eq("school_id", school.id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Student not found." };

  const patch: Record<string, unknown> = {
    name,
    date_of_birth: dob.value,
    enrolled_at: enrolled.value,
  };
  if (dob.value) patch.age_group = ageBandFor(ageInMonths(dob.value) ?? 0);
  if (school.type === "regular" && input.classId !== undefined) {
    patch.class_id = input.classId || null;
  }

  const { error } = await supabase
    .from("students")
    .update(patch)
    .eq("id", input.studentId)
    .eq("school_id", school.id);
  if (error) return { ok: false, error: error.message };

  if (school.type !== "regular" && dob.value && dob.value !== current.date_of_birth) {
    await placeByAge(supabase, { studentId: input.studentId });
  }

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${input.studentId}`);
  revalidatePath("/dashboard/classrooms");
  return { ok: true };
}

// Edit a child's parameters (allergies, medical notes, emergency contact).
// Staff-managed — RLS allows admin/teacher writes; parents read only.
export async function updateStudentParameters(input: {
  studentId: string;
  allergies: string[];
  medicalNotes?: string;
  emergencyContact: { name?: string; phone?: string; relationship?: string };
}): Promise<Result> {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  if (ctx.role !== "admin" && ctx.role !== "teacher") {
    return { ok: false, error: "Not authorized" };
  }

  const ec = input.emergencyContact;
  const emergency =
    ec.name?.trim() || ec.phone?.trim() || ec.relationship?.trim()
      ? {
          name: ec.name?.trim() || "",
          phone: ec.phone?.trim() || "",
          relationship: ec.relationship?.trim() || "",
        }
      : null;

  const { error } = await supabase
    .from("students")
    .update({
      allergies: input.allergies,
      medical_notes: input.medicalNotes?.trim() || null,
      emergency_contact: emergency,
    })
    .eq("id", input.studentId)
    .eq("school_id", ctx.school.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/students/${input.studentId}`);
  revalidatePath("/parent/parameters");
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

export async function updateMedication(input: {
  medicationId: string;
  studentId: string;
  name: string;
  dosage?: string;
  time?: string;
  notes?: string;
}): Promise<Result> {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  if (ctx.role !== "admin" && ctx.role !== "teacher") {
    return { ok: false, error: "Not authorized" };
  }
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter the medication name." };
  const { error } = await supabase
    .from("student_medications")
    .update({
      name,
      dosage: input.dosage?.trim() || null,
      time: input.time?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .eq("id", input.medicationId)
    .eq("student_id", input.studentId);
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
