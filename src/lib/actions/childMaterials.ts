"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";
import { getTeacherClassrooms } from "@/lib/db/classrooms";
import { getTeacherClasses } from "@/lib/db/classes";
import { getStudentParentEmails } from "@/lib/db/people";
import { sendChildMaterialShared } from "@/lib/email/notifications";
import {
  deleteDocument,
  isCloudinaryConfigured,
  uploadDocument,
} from "@/lib/cloudinary";
import {
  MAX_MATERIAL_BYTES,
  MATERIAL_CATEGORY_LABELS,
  fileExtension,
  isAllowedExtension,
  isMaterialCategory,
  type MaterialCategory,
} from "@/lib/materials";

type Result = { ok: boolean; error?: string };

const TEACHER_SHELF = "/teacher/materials";
const PARENT_SHELF = "/parent/materials";

function revalidateShelves() {
  revalidatePath(TEACHER_SHELF);
  revalidatePath(PARENT_SHELF);
}

/**
 * Staff-only, and for a teacher narrowed again to the children they are
 * assigned — their classrooms (Montessori) or their classes (regular). RLS
 * alone would let any member of staff upload for any child in the school, so
 * this mirrors the deny-by-default rule in getTeacherStudents and
 * recordAttendance. Keep the three in step.
 */
async function requireStudentInScope(studentId: string) {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) return { error: "Not authorized" as const };
  if (ctx.role !== "admin" && ctx.role !== "teacher") {
    return { error: "Not authorized" as const };
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, name, school_id, classroom, class_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!student || student.school_id !== ctx.school.id) {
    return { error: "That child isn't in your school." as const };
  }

  if (ctx.role === "teacher") {
    if (ctx.school.type === "montessori") {
      const classrooms = await getTeacherClassrooms(
        supabase,
        ctx.user.id,
        ctx.school.id,
      );
      if (!classrooms.includes(student.classroom ?? "")) {
        return { error: "That child isn't in a classroom you cover." as const };
      }
    } else {
      const classes = await getTeacherClasses(
        supabase,
        ctx.user.id,
        ctx.school.id,
      );
      if (!classes.some((c) => c.id === student.class_id)) {
        return { error: "That child isn't in a class you teach." as const };
      }
    }
  }

  // `school` is lifted out of ctx so one null check at the call site
  // narrows it — a nested ctx.school stays possibly-null after destructuring.
  return { error: null, ctx, school: ctx.school, supabase, student };
}

/** Bytes behind a base64 data URL, without decoding it. */
function base64Bytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return 0;
  const body = dataUrl.slice(comma + 1);
  const padding = body.endsWith("==") ? 2 : body.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((body.length * 3) / 4) - padding);
}

export async function createChildMaterial(input: {
  studentId: string;
  title: string;
  description?: string;
  category: string;
  fileName: string;
  /** base64 data URL read from the file input. */
  dataUrl: string;
}): Promise<Result & { id?: string }> {
  const scope = await requireStudentInScope(input.studentId);
  if (scope.error || !scope.ctx || !scope.school || !scope.supabase) {
    return { ok: false, error: scope.error ?? "Not authorized" };
  }
  const { ctx, school, supabase, student } = scope;

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Give the material a title." };

  const category: MaterialCategory = isMaterialCategory(input.category)
    ? input.category
    : "resource";

  const fileName = input.fileName.trim();
  const ext = fileExtension(fileName);
  if (!isAllowedExtension(ext)) {
    return {
      ok: false,
      error: "Upload a PDF, Word, slides, spreadsheet, text or image file.",
    };
  }
  if (!input.dataUrl.startsWith("data:")) {
    return { ok: false, error: "Choose a file to share." };
  }

  const bytes = base64Bytes(input.dataUrl);
  if (bytes > MAX_MATERIAL_BYTES) {
    return { ok: false, error: "That file is larger than 10 MB." };
  }
  if (!isCloudinaryConfigured) {
    return { ok: false, error: "File uploads are not configured." };
  }

  let uploaded;
  try {
    uploaded = await uploadDocument(
      input.dataUrl,
      `schoolhub/${school.id}/child-materials`,
      fileName.replace(/\.[^.]+$/, ""),
      ext,
    );
  } catch {
    return { ok: false, error: "The upload failed. Please try again." };
  }

  const { data, error } = await supabase
    .from("child_materials")
    .insert({
      school_id: school.id,
      student_id: input.studentId,
      uploaded_by: ctx.user.id,
      title,
      description: input.description?.trim() || null,
      category,
      file_url: uploaded.url,
      file_name: fileName,
      file_ext: ext,
      file_size_bytes: uploaded.bytes || bytes,
      storage_public_id: uploaded.publicId,
    })
    .select("id")
    .single();

  if (error) {
    // Don't leave an orphaned asset behind when the row never landed.
    await deleteDocument(uploaded.publicId);
    return { ok: false, error: error.message };
  }

  // Best-effort notification; a mail failure must not undo the share.
  try {
    const emails = await getStudentParentEmails(supabase, input.studentId);
    if (emails.length > 0) {
      await sendChildMaterialShared(emails, school.name, {
        studentName: student.name,
        title,
        category: MATERIAL_CATEGORY_LABELS[category],
      });
    }
  } catch {
    // ignored
  }

  revalidateShelves();
  return { ok: true, id: data.id };
}

export async function updateChildMaterial(input: {
  id: string;
  title: string;
  description?: string;
  category: string;
}): Promise<Result> {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  if (ctx.role !== "admin" && ctx.role !== "teacher") {
    return { ok: false, error: "Not authorized" };
  }

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Give the material a title." };

  const { data: current } = await supabase
    .from("child_materials")
    .select("student_id")
    .eq("id", input.id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Material not found." };

  const scope = await requireStudentInScope(current.student_id);
  if (scope.error) return { ok: false, error: scope.error };

  const { data, error } = await supabase
    .from("child_materials")
    .update({
      title,
      description: input.description?.trim() || null,
      category: isMaterialCategory(input.category) ? input.category : "resource",
    })
    .eq("id", input.id)
    .eq("school_id", ctx.school.id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: "Material not found." };

  revalidateShelves();
  return { ok: true };
}

export async function deleteChildMaterial(id: string): Promise<Result> {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) return { ok: false, error: "Not authorized" };
  if (ctx.role !== "admin" && ctx.role !== "teacher") {
    return { ok: false, error: "Not authorized" };
  }

  const { data: current } = await supabase
    .from("child_materials")
    .select("student_id, storage_public_id")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Material not found." };

  const scope = await requireStudentInScope(current.student_id);
  if (scope.error) return { ok: false, error: scope.error };

  const { error } = await supabase
    .from("child_materials")
    .delete()
    .eq("id", id)
    .eq("school_id", ctx.school.id);
  if (error) return { ok: false, error: error.message };

  if (current.storage_public_id) {
    await deleteDocument(current.storage_public_id);
  }

  revalidateShelves();
  return { ok: true };
}
