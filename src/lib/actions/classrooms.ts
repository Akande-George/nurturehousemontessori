"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";

type Result = { ok: boolean; error?: string };

async function adminCtx() {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx || ctx.role !== "admin" || !ctx.school || !supabase) return null;
  return { schoolId: ctx.school.id, supabase };
}

// Classroom names are denormalised onto students and teacher assignments, so
// every screen that shows a room needs refreshing after a change.
function revalidateClassrooms() {
  revalidatePath("/dashboard/classrooms");
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/settings");
}

function uniqueError(error: { code?: string; message: string }, name: string) {
  return error.code === "23505"
    ? `A classroom called "${name}" already exists.`
    : error.message;
}

export async function createClassroom(input: {
  name: string;
  ageGroup?: string | null;
}): Promise<Result> {
  const c = await adminCtx();
  if (!c) return { ok: false, error: "Not authorized" };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a classroom name." };

  const { data: last } = await c.supabase
    .from("classrooms")
    .select("sort_order")
    .eq("school_id", c.schoolId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await c.supabase.from("classrooms").insert({
    school_id: c.schoolId,
    name,
    age_group: input.ageGroup?.trim() || null,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) return { ok: false, error: uniqueError(error, name) };

  revalidateClassrooms();
  return { ok: true };
}

export async function updateClassroom(
  id: string,
  input: { name: string; ageGroup?: string | null },
): Promise<Result> {
  const c = await adminCtx();
  if (!c) return { ok: false, error: "Not authorized" };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a classroom name." };

  const { data: current } = await c.supabase
    .from("classrooms")
    .select("*")
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .maybeSingle();
  if (!current) return { ok: false, error: "Classroom not found." };

  const renamed = current.name !== name;
  if (renamed) {
    const { data: clash } = await c.supabase
      .from("classrooms")
      .select("id")
      .eq("school_id", c.schoolId)
      .eq("name", name)
      .maybeSingle();
    if (clash) {
      return { ok: false, error: `A classroom called "${name}" already exists.` };
    }

    // Carry the new name across everything that stores a room name, before the
    // room row itself, so a failure leaves the old name intact.
    const { error: sErr } = await c.supabase
      .from("students")
      .update({ classroom: name })
      .eq("school_id", c.schoolId)
      .eq("classroom", current.name);
    if (sErr) return { ok: false, error: sErr.message };

    const { error: tErr } = await c.supabase
      .from("teacher_classroom_assignments")
      .update({ classroom: name })
      .eq("school_id", c.schoolId)
      .eq("classroom", current.name);
    if (tErr) return { ok: false, error: tErr.message };
  }

  const { error } = await c.supabase
    .from("classrooms")
    .update({ name, age_group: input.ageGroup?.trim() || null })
    .eq("id", id);
  if (error) return { ok: false, error: uniqueError(error, name) };

  revalidateClassrooms();
  return { ok: true };
}

export async function deleteClassroom(id: string): Promise<Result> {
  const c = await adminCtx();
  if (!c) return { ok: false, error: "Not authorized" };

  const { data: current } = await c.supabase
    .from("classrooms")
    .select("*")
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .maybeSingle();
  if (!current) return { ok: false, error: "Classroom not found." };

  // Refuse while children are still in the room rather than leaving them
  // without a classroom.
  const { count } = await c.supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("school_id", c.schoolId)
    .eq("classroom", current.name);
  if (count) {
    return {
      ok: false,
      error: `${count} ${count === 1 ? "child is" : "children are"} still in ${current.name}. Move them to another classroom first.`,
    };
  }

  // Teacher assignments for a removed room are cleared with it.
  await c.supabase
    .from("teacher_classroom_assignments")
    .delete()
    .eq("school_id", c.schoolId)
    .eq("classroom", current.name);

  const { error } = await c.supabase.from("classrooms").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateClassrooms();
  return { ok: true };
}
