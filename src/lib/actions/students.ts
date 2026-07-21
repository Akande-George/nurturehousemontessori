"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";

type Result = { ok: boolean; error?: string };

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
