// Lightweight per-area rollup of a child's observations — the "general report of
// all the child has done" that both the teacher editor and the parent termly
// report render.
export type ObsLite = {
  areaName: string | null;
  activityName: string | null;
  leafName: string | null;
  content: string;
  created_at: string;
};

export type AreaRollup = {
  area: string;
  count: number;
  activities: string[]; // distinct, specific activities (excludes general notes)
};

export function summarizeByArea(obs: ObsLite[]): AreaRollup[] {
  const map = new Map<string, { count: number; activities: Set<string> }>();
  for (const o of obs) {
    const area = o.areaName ?? "Other";
    const entry = map.get(area) ?? { count: 0, activities: new Set<string>() };
    entry.count += 1;
    if (o.activityName && o.activityName !== "General") {
      entry.activities.add(o.activityName);
    }
    map.set(area, entry);
  }
  return [...map.entries()]
    .map(([area, v]) => ({ area, count: v.count, activities: [...v.activities] }))
    .sort((a, b) => b.count - a.count);
}
