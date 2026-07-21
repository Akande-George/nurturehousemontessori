// Client-usable helpers that compute Montessori curriculum stats from real
// Supabase `curriculum_progress` rows (plus their practice history) against the
// static curriculum catalog. Mirrors the shapes the old demo-store produced so
// the pedagogy UI can stay unchanged.

import { CURRICULUM, getAllLeaves, type Leaf } from "./curriculum";
import type { CurriculumStatus } from "@/lib/db/types";

export type ProgressEntry = {
  status: CurriculumStatus;
  practices: string[]; // practiced_on dates, sorted ascending
};

export type ProgressMap = Record<string, ProgressEntry>;

export type ProgressRow = {
  leaf_id: string;
  status: CurriculumStatus;
  practices: { practiced_on: string }[];
};

/** Build a `{ [leafId]: { status, practices } }` map from DB rows. */
export function buildProgressMap(rows: ProgressRow[]): ProgressMap {
  const map: ProgressMap = {};
  for (const row of rows) {
    map[row.leaf_id] = {
      status: row.status,
      practices: (row.practices ?? [])
        .map((p) => p.practiced_on)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    };
  }
  return map;
}

export type CurriculumAreaStats = {
  total: number;
  introduced: number;
  developing: number;
  proficient: number;
  notStarted: number;
};

export type CurriculumStats = {
  overall: CurriculumAreaStats;
  byArea: Record<string, CurriculumAreaStats>;
};

function emptyStats(): CurriculumAreaStats {
  return { total: 0, introduced: 0, developing: 0, proficient: 0, notStarted: 0 };
}

function tallyStatus(stats: CurriculumAreaStats, status: CurriculumStatus) {
  stats.total += 1;
  if (status === "introduced") stats.introduced += 1;
  else if (status === "developing") stats.developing += 1;
  else if (status === "proficient") stats.proficient += 1;
  else stats.notStarted += 1;
}

export function getCurriculumStats(progress: ProgressMap): CurriculumStats {
  const overall = emptyStats();
  const byArea: Record<string, CurriculumAreaStats> = {};
  for (const area of CURRICULUM) byArea[area.id] = emptyStats();

  for (const leaf of getAllLeaves()) {
    const p = progress[leaf.leafId];
    const status: CurriculumStatus = p ? p.status : "not_started";
    tallyStatus(overall, status);
    tallyStatus(byArea[leaf.areaId], status);
  }
  return { overall, byArea };
}

export function getLeavesByStatus(
  progress: ProgressMap,
  status: CurriculumStatus,
): Leaf[] {
  const out: Leaf[] = [];
  for (const leaf of getAllLeaves()) {
    const p = progress[leaf.leafId];
    const current: CurriculumStatus = p ? p.status : "not_started";
    if (current === status) out.push(leaf);
  }
  return out;
}

export function getMasteredLeaves(progress: ProgressMap): Leaf[] {
  return getLeavesByStatus(progress, "proficient");
}

export type RecentPresentation = {
  leafId: string;
  date: string;
  sessionIndex: number; // 0-indexed within this leaf's practice history
  leaf: Leaf;
};

export function getRecentPresentations(
  progress: ProgressMap,
  leafById: (id: string) => Leaf | undefined,
  limit = 8,
): RecentPresentation[] {
  const out: RecentPresentation[] = [];
  for (const [leafId, entry] of Object.entries(progress)) {
    const leaf = leafById(leafId);
    if (!leaf) continue;
    entry.practices.forEach((date, i) => {
      out.push({ leafId, date, sessionIndex: i, leaf });
    });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}

export function touchedPercent(stats: CurriculumAreaStats): number {
  if (stats.total === 0) return 0;
  return Math.round(
    ((stats.introduced + stats.developing + stats.proficient) / stats.total) *
      100,
  );
}
