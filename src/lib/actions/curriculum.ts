"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { getActiveContext } from "@/lib/auth/context";
import { CURRICULUM, generalLeafId } from "@/lib/curriculum/curriculum";
import {
  CUSTOM_NODE_PREFIX,
  PARENT_KIND,
  findCurriculumNode,
  type CurriculumNodeKind,
} from "@/lib/curriculum/school-curriculum";
import { getSchoolCurriculum } from "@/lib/db/curriculum";

type Result = { ok: boolean; error?: string };

const MAX_NAME = 120;
const MAX_DESCRIPTION = 500;

// Admins and teachers of the active school can both edit the curriculum
// (RLS: is_school_staff on curriculum_nodes).
async function staffCtx() {
  const ctx = await getActiveContext();
  const supabase = await createClient();
  if (!ctx?.school || !supabase) return null;
  if (ctx.role !== "admin" && ctx.role !== "teacher") return null;
  return { schoolId: ctx.school.id, supabase, isAdmin: ctx.role === "admin" };
}

// Every screen that renders the catalog — pickers, matrices, feeds, reports.
function revalidateCurriculum() {
  revalidatePath("/dashboard/curriculum");
  revalidatePath("/teacher", "layout");
  revalidatePath("/parent", "layout");
}

function missingTable(error: { code?: string; message: string }): string {
  // 42P01 = undefined_table: the curriculum_nodes migration isn't applied yet.
  return error.code === "42P01" || /curriculum_nodes/.test(error.message)
    ? "Curriculum editing isn't set up yet — apply the curriculum_nodes migration."
    : error.message;
}

export async function addCurriculumNode(input: {
  kind: CurriculumNodeKind;
  parentId: string | null;
  name: string;
  description?: string;
}): Promise<Result & { id?: string }> {
  const c = await staffCtx();
  if (!c) return { ok: false, error: "Not authorized" };
  if (!(input.kind in PARENT_KIND)) return { ok: false, error: "Unknown item type." };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a name." };
  if (name.length > MAX_NAME) return { ok: false, error: "That name is too long." };
  const description = input.description?.trim() || null;
  if (description && description.length > MAX_DESCRIPTION) {
    return { ok: false, error: "That description is too long." };
  }

  // The parent must exist in this school's catalog and be the right level.
  const parentKind = PARENT_KIND[input.kind];
  if (parentKind) {
    if (!input.parentId) return { ok: false, error: "Choose where to add it." };
    const { all } = await getSchoolCurriculum(c.supabase, c.schoolId);
    const parent = findCurriculumNode(all, input.parentId);
    if (!parent || parent.kind !== parentKind) {
      return { ok: false, error: "That parent no longer exists." };
    }
  }

  const id = `${CUSTOM_NODE_PREFIX}${crypto.randomUUID()}`;
  const { error } = await c.supabase.from("curriculum_nodes").insert({
    school_id: c.schoolId,
    node_id: id,
    kind: input.kind,
    parent_node_id: parentKind ? input.parentId : null,
    name,
    description: input.kind === "variation" ? null : description,
  });
  if (error) return { ok: false, error: missingTable(error) };
  revalidateCurriculum();
  return { ok: true, id };
}

// Rename / re-describe any node. For a built-in node this writes (or updates)
// its override row; the built-in text itself never changes.
export async function updateCurriculumNode(input: {
  nodeId: string;
  name: string;
  description?: string | null;
}): Promise<Result> {
  const c = await staffCtx();
  if (!c) return { ok: false, error: "Not authorized" };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a name." };
  if (name.length > MAX_NAME) return { ok: false, error: "That name is too long." };
  const description =
    input.description === undefined ? undefined : input.description?.trim() ?? "";
  if (description && description.length > MAX_DESCRIPTION) {
    return { ok: false, error: "That description is too long." };
  }

  const { all } = await getSchoolCurriculum(c.supabase, c.schoolId);
  const found = findCurriculumNode(all, input.nodeId);
  if (!found) return { ok: false, error: "That item no longer exists." };

  const { error } = await c.supabase.from("curriculum_nodes").upsert(
    {
      school_id: c.schoolId,
      node_id: input.nodeId,
      kind: found.kind,
      name,
      ...(description !== undefined && found.kind !== "variation" ? { description } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "school_id,node_id" },
  );
  if (error) return { ok: false, error: missingTable(error) };
  revalidateCurriculum();
  return { ok: true };
}

// Hide or unhide any node (admins only — it changes what the whole school
// sees). Hidden nodes drop out of pickers, matrices and stats, but records
// already filed against them keep resolving.
export async function setCurriculumNodeHidden(input: {
  nodeId: string;
  hidden: boolean;
}): Promise<Result> {
  const c = await staffCtx();
  if (!c?.isAdmin) return { ok: false, error: "Only an admin can hide curriculum items." };

  const { all } = await getSchoolCurriculum(c.supabase, c.schoolId);
  const found = findCurriculumNode(all, input.nodeId);
  if (!found) return { ok: false, error: "That item no longer exists." };

  const { error } = await c.supabase.from("curriculum_nodes").upsert(
    {
      school_id: c.schoolId,
      node_id: input.nodeId,
      kind: found.kind,
      hidden: input.hidden,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "school_id,node_id" },
  );
  if (error) return { ok: false, error: missingTable(error) };
  revalidateCurriculum();
  return { ok: true };
}

// Delete a school-added node and everything under it (admins only). Built-in
// nodes can only be hidden. Refuses when any observation, progress row or activity post is
// filed under the subtree — those would lose their lesson name — and points
// the user at Hide instead.
export async function deleteCurriculumNode(nodeId: string): Promise<Result> {
  const c = await staffCtx();
  if (!c?.isAdmin) return { ok: false, error: "Only an admin can delete curriculum items." };
  if (findCurriculumNode(CURRICULUM, nodeId)) {
    return { ok: false, error: "Built-in items can't be deleted — hide them instead." };
  }

  const { all } = await getSchoolCurriculum(c.supabase, c.schoolId);
  const found = findCurriculumNode(all, nodeId);
  if (!found || !found.node.custom) return { ok: false, error: "That item no longer exists." };

  const ids = found.subtreeIds;
  const leafIds = found.kind === "area" ? [...ids, generalLeafId(nodeId)] : ids;
  const inUse = await Promise.all(
    (["observations", "curriculum_progress", "activity_posts"] as const).map(async (table) => {
      const { count } = await c.supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("school_id", c.schoolId)
        .in("leaf_id", leafIds);
      return (count ?? 0) > 0;
    }),
  );
  if (inUse.some(Boolean)) {
    return {
      ok: false,
      error: "Children already have records under this item — hide it instead.",
    };
  }

  const { error } = await c.supabase
    .from("curriculum_nodes")
    .delete()
    .eq("school_id", c.schoolId)
    .in("node_id", ids);
  if (error) return { ok: false, error: missingTable(error) };
  revalidateCurriculum();
  return { ok: true };
}
