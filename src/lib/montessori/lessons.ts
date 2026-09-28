// Shared "which lessons did this child work on between these dates, and how do
// they group" logic. Used by both the termly progress report (a marking period)
// and the daily report (a single day).
//
// Pure. Every helper takes the school's FULL curriculum catalog (hidden nodes
// included, so history on a since-hidden lesson still reports) and defaults to
// the built-in album.

import {
  CURRICULUM,
  getLeafById,
  getLeafIndex,
  isGeneralLeafId,
  type Area,
} from "@/lib/curriculum/curriculum";
import type { CurriculumStatus } from "@/lib/db/types";

export type LessonEntry = {
  leafId: string;
  leafName: string;
  level: CurriculumStatus;
  practiceCount: number;
  lastPracticedOn: string | null;
};

export type LessonSubcategoryBlock = {
  subcategoryId: string;
  subcategoryName: string;
  description: string | null;
  lessons: LessonEntry[];
};

export type LessonAreaGroup = {
  areaId: string;
  areaName: string;
  areaDescription: string;
  subcategories: LessonSubcategoryBlock[];
};

export type LessonProgressRow = {
  leaf_id: string;
  status: CurriculumStatus;
  updated_at: string;
  practices: { practiced_on: string }[];
};

const day = (iso: string) => iso.slice(0, 10);
const inRange = (d: string, from: string, to: string) => d >= from && d <= to;

/**
 * Lessons touched between `from` and `to` (inclusive, YYYY-MM-DD). A leaf counts
 * as touched when either:
 *   (a) it has a practice date inside the window, or
 *   (b) it has no practice rows at all and its status changed inside the window.
 *
 * Clause (b) matters because setCurriculumStatus can advance a lesson without
 * addPractice ever writing a practice row — without it those lessons would
 * silently vanish from the report.
 *
 * `not_started` leaves, general-observation markers and leaves whose catalog
 * entry has since disappeared are always excluded.
 */
export function selectLessonsInWindow(
  rows: LessonProgressRow[],
  from: string,
  to: string,
  catalog: Area[] = CURRICULUM,
): Map<string, LessonEntry> {
  const out = new Map<string, LessonEntry>();
  for (const row of rows) {
    if (row.status === "not_started") continue;
    if (isGeneralLeafId(row.leaf_id)) continue;
    const leaf = getLeafById(row.leaf_id, catalog);
    if (!leaf) continue;

    const practices = row.practices ?? [];
    const inWindow = practices
      .map((p) => day(p.practiced_on))
      .filter((d) => inRange(d, from, to))
      .sort();

    const touchedByPractice = inWindow.length > 0;
    const touchedByStatus =
      practices.length === 0 && inRange(day(row.updated_at), from, to);
    if (!touchedByPractice && !touchedByStatus) continue;

    out.set(row.leaf_id, {
      leafId: row.leaf_id,
      leafName: leaf.leafName,
      level: row.status,
      practiceCount: inWindow.length,
      lastPracticedOn: inWindow.at(-1) ?? null,
    });
  }
  return out;
}

/** Every lesson the child has ever touched, with its current level. */
export function selectAllLessons(
  rows: LessonProgressRow[],
  catalog: Area[] = CURRICULUM,
): Map<string, LessonEntry> {
  const out = new Map<string, LessonEntry>();
  for (const row of rows) {
    if (row.status === "not_started") continue;
    if (isGeneralLeafId(row.leaf_id)) continue;
    const leaf = getLeafById(row.leaf_id, catalog);
    if (!leaf) continue;

    const dates = (row.practices ?? []).map((p) => day(p.practiced_on)).sort();
    out.set(row.leaf_id, {
      leafId: row.leaf_id,
      leafName: leaf.leafName,
      level: row.status,
      practiceCount: dates.length,
      lastPracticedOn: dates.at(-1) ?? null,
    });
  }
  return out;
}

/**
 * Group chosen leaves into Area -> Subcategory -> lessons in curriculum (album)
 * order rather than alphabetically. Empty subcategories are dropped; empty areas
 * are kept so a report can say "no lessons this period" — except hidden areas,
 * which only appear when they still carry lessons.
 */
export function groupIntoAreas(
  lessonByLeafId: Map<string, LessonEntry>,
  catalog: Area[] = CURRICULUM,
): LessonAreaGroup[] {
  // The leaf index is already in album order, so one pass preserves it.
  const bySubcategory = new Map<string, LessonEntry[]>();
  for (const leaf of getLeafIndex(catalog).values()) {
    const lesson = lessonByLeafId.get(leaf.leafId);
    if (!lesson) continue;
    const list = bySubcategory.get(leaf.subcategoryId) ?? [];
    list.push(lesson);
    bySubcategory.set(leaf.subcategoryId, list);
  }

  return catalog
    .map((area) => ({
      hidden: !!area.hidden,
      group: {
        areaId: area.id,
        areaName: area.name,
        areaDescription: area.description,
        subcategories: area.subcategories
          .map((sub) => ({
            subcategoryId: sub.id,
            subcategoryName: sub.name,
            description: sub.description ?? null,
            lessons: bySubcategory.get(sub.id) ?? [],
          }))
          .filter((sub) => sub.lessons.length > 0),
      },
    }))
    .filter(({ hidden, group }) => !hidden || group.subcategories.length > 0)
    .map(({ group }) => group);
}

/** Drops areas with no lessons — for a single day, empty areas are just noise. */
export function groupIntoNonEmptyAreas(
  lessonByLeafId: Map<string, LessonEntry>,
  catalog: Area[] = CURRICULUM,
): LessonAreaGroup[] {
  return groupIntoAreas(lessonByLeafId, catalog).filter(
    (a) => a.subcategories.length > 0,
  );
}
