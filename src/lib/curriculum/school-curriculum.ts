// Merges a school's `curriculum_nodes` overlay onto the built-in album.
//
// Pure and client-safe: it takes already-fetched rows (see
// src/lib/db/curriculum.ts) and returns two catalogs —
//   * `all`     every node, hidden ones included and flagged `hidden: true`, so
//               observations / progress filed against a since-hidden activity
//               still resolve to a name;
//   * `visible` what pickers, matrices and stats show.
// With no rows both are the built-in CURRICULUM itself (same instance), which
// is also the fallback when the table doesn't exist yet.

import { CUSTOM_AREA_TONES } from "@/components/montessori/area-tones";
import type { Activity, Area, Subcategory, Variation } from "./curriculum";

export const CURRICULUM_NODE_KINDS = [
  "area",
  "subcategory",
  "activity",
  "variation",
] as const;
export type CurriculumNodeKind = (typeof CURRICULUM_NODE_KINDS)[number];

/** The kind a node's parent must be (areas are top-level). */
export const PARENT_KIND: Record<CurriculumNodeKind, CurriculumNodeKind | null> = {
  area: null,
  subcategory: "area",
  activity: "subcategory",
  variation: "activity",
};

export type CurriculumNodeRow = {
  node_id: string;
  kind: string;
  parent_node_id: string | null;
  name: string | null;
  description: string | null;
  hidden: boolean;
  sort_order: number | null;
  created_at?: string;
};

export type SchoolCurriculum = { visible: Area[]; all: Area[] };

/** Prefix for school-added node ids, so they can never collide with built-ins. */
export const CUSTOM_NODE_PREFIX = "c-";

export function isCustomNodeId(nodeId: string): boolean {
  return nodeId.startsWith(CUSTOM_NODE_PREFIX);
}

type AnyNode = Area | Subcategory | Activity | Variation;
type Entry = { kind: CurriculumNodeKind; node: AnyNode };

const KIND_RANK: Record<string, number> = {
  area: 0,
  subcategory: 1,
  activity: 2,
  variation: 3,
};

function cloneAreas(base: Area[]): Area[] {
  return base.map((area) => ({
    ...area,
    tone: { ...area.tone },
    subcategories: area.subcategories.map((sub) => ({
      ...sub,
      activities: sub.activities.map((act) => ({
        ...act,
        variations: act.variations.map((v) => ({ ...v })),
      })),
    })),
  }));
}

/** Stable re-sort by explicit sort_order, falling back to current position. */
function applyOrder<T extends AnyNode>(list: T[], order: Map<AnyNode, number>): T[] {
  if (!list.some((n) => order.has(n))) return list;
  return list
    .map((node, i) => ({ node, key: order.get(node) ?? i, i }))
    .sort((a, b) => a.key - b.key || a.i - b.i)
    .map((x) => x.node);
}

export function buildSchoolCurriculum(
  base: Area[],
  rows: CurriculumNodeRow[],
): SchoolCurriculum {
  if (rows.length === 0) return { visible: base, all: base };

  const all = cloneAreas(base);
  const byId = new Map<string, Entry>();
  for (const area of all) {
    byId.set(area.id, { kind: "area", node: area });
    for (const sub of area.subcategories) {
      byId.set(sub.id, { kind: "subcategory", node: sub });
      for (const act of sub.activities) {
        byId.set(act.id, { kind: "activity", node: act });
        for (const v of act.variations) byId.set(v.id, { kind: "variation", node: v });
      }
    }
  }

  const order = new Map<AnyNode, number>();
  // null name / description mean "keep the built-in value"; variations carry no
  // description.
  const applyRow = (entry: Entry, row: CurriculumNodeRow) => {
    const { kind, node } = entry;
    if (row.name && row.name.trim()) node.name = row.name.trim();
    if (row.description !== null && kind !== "variation") {
      (node as Area | Subcategory | Activity).description = row.description;
    }
    if (row.hidden) node.hidden = true;
    if (row.sort_order !== null) order.set(node, row.sort_order);
  };

  // Overrides first (rows naming a built-in id), then custom nodes parents-first
  // so a custom activity can hang off a custom section added in the same batch.
  const customRows: CurriculumNodeRow[] = [];
  for (const row of rows) {
    const existing = byId.get(row.node_id);
    if (existing) applyRow(existing, row);
    else customRows.push(row);
  }
  customRows.sort(
    (a, b) =>
      (KIND_RANK[a.kind] ?? 9) - (KIND_RANK[b.kind] ?? 9) ||
      (a.created_at ?? "").localeCompare(b.created_at ?? ""),
  );

  let customAreaCount = 0;
  for (const row of customRows) {
    const kind = row.kind as CurriculumNodeKind;
    if (!(kind in PARENT_KIND)) continue;
    const name = row.name?.trim() || "Untitled";

    if (kind === "area") {
      const palette = CUSTOM_AREA_TONES[customAreaCount++ % CUSTOM_AREA_TONES.length];
      const area: Area = {
        id: row.node_id,
        name,
        color: palette.color,
        tone: { ...palette.tone },
        description: row.description ?? "",
        subcategories: [],
        custom: true,
      };
      const entry: Entry = { kind, node: area };
      all.push(area);
      byId.set(area.id, entry);
      applyRow(entry, row);
      continue;
    }

    // Orphans (parent deleted, or wrong parent kind) are skipped silently.
    const parent = row.parent_node_id ? byId.get(row.parent_node_id) : undefined;
    if (!parent || parent.kind !== PARENT_KIND[kind]) continue;

    let node: AnyNode;
    if (kind === "subcategory") {
      node = { id: row.node_id, name, activities: [], custom: true } satisfies Subcategory;
      (parent.node as Area).subcategories.push(node as Subcategory);
    } else if (kind === "activity") {
      node = { id: row.node_id, name, variations: [], custom: true } satisfies Activity;
      (parent.node as Subcategory).activities.push(node as Activity);
    } else {
      node = { id: row.node_id, name, custom: true } satisfies Variation;
      (parent.node as Activity).variations.push(node as Variation);
    }
    const entry: Entry = { kind, node };
    byId.set(node.id, entry);
    applyRow(entry, row);
  }

  // Apply explicit ordering at every level.
  const ordered = applyOrder(all, order).map((area) => {
    area.subcategories = applyOrder(area.subcategories, order);
    for (const sub of area.subcategories) {
      sub.activities = applyOrder(sub.activities, order);
      for (const act of sub.activities) act.variations = applyOrder(act.variations, order);
    }
    return area;
  });

  return { visible: visibleCurriculum(ordered), all: ordered };
}

const visibleCache = new WeakMap<Area[], Area[]>();

/**
 * Drops hidden nodes (and everything under a hidden parent). Memoised per
 * array, and returns the input itself when nothing is hidden.
 */
export function visibleCurriculum(all: Area[]): Area[] {
  const cached = visibleCache.get(all);
  if (cached) return cached;
  const anyHidden = all.some(
    (a) =>
      a.hidden ||
      a.subcategories.some(
        (s) =>
          s.hidden ||
          s.activities.some((act) => act.hidden || act.variations.some((v) => v.hidden)),
      ),
  );
  const out = !anyHidden
    ? all
    : all
        .filter((a) => !a.hidden)
        .map((a) => ({
          ...a,
          subcategories: a.subcategories
            .filter((s) => !s.hidden)
            .map((s) => ({
              ...s,
              activities: s.activities
                .filter((act) => !act.hidden)
                .map((act) => ({
                  ...act,
                  variations: act.variations.filter((v) => !v.hidden),
                })),
            })),
        }));
  visibleCache.set(all, out);
  return out;
}

export type FoundNode = {
  kind: CurriculumNodeKind;
  node: Area | Subcategory | Activity | Variation;
  parentId: string | null;
  /** This node's id plus every node id beneath it. */
  subtreeIds: string[];
};

function subtree(kind: CurriculumNodeKind, node: AnyNode): string[] {
  if (kind === "area") {
    return [node.id, ...(node as Area).subcategories.flatMap((s) => subtree("subcategory", s))];
  }
  if (kind === "subcategory") {
    return [node.id, ...(node as Subcategory).activities.flatMap((a) => subtree("activity", a))];
  }
  if (kind === "activity") {
    return [node.id, ...(node as Activity).variations.map((v) => v.id)];
  }
  return [node.id];
}

/** Locate any node (area, section, activity or variation) in a catalog. */
export function findCurriculumNode(areas: Area[], nodeId: string): FoundNode | null {
  const found = (kind: CurriculumNodeKind, node: AnyNode, parentId: string | null): FoundNode => ({
    kind,
    node,
    parentId,
    subtreeIds: subtree(kind, node),
  });
  for (const area of areas) {
    if (area.id === nodeId) return found("area", area, null);
    for (const sub of area.subcategories) {
      if (sub.id === nodeId) return found("subcategory", sub, area.id);
      for (const act of sub.activities) {
        if (act.id === nodeId) return found("activity", act, sub.id);
        for (const v of act.variations) {
          if (v.id === nodeId) return found("variation", v, act.id);
        }
      }
    }
  }
  return null;
}
