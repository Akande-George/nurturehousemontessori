import type { Enums } from "@/lib/db/types";

export type AgeGroup = Enums["age_group"];

// The five Montessori age bands, youngest first — what the student form offers.
export const AGE_BANDS: { value: AgeGroup; label: string }[] = [
  { value: "nido_0_1_5", label: "0–1.5 · Nido" },
  { value: "toddler_1_5_3", label: "1.5–3 · Toddler Community" },
  { value: "primary_3_6", label: "3–6 · Children's House" },
  { value: "lower_7_9", label: "6–9 · Lower Elementary" },
  { value: "upper_9_12", label: "9–12 · Upper Elementary" },
];

// Every enum value, including the retired 0–2 band still on older records.
export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  ...(Object.fromEntries(AGE_BANDS.map((b) => [b.value, b.label])) as Record<
    AgeGroup,
    string
  >),
  infant_0_2: "Infant (0–2)",
};

export function isAgeBand(value: string): value is AgeGroup {
  return AGE_BANDS.some((b) => b.value === value);
}

// Whole months from a date of birth ("2021-03-14") to today — the same count
// as the database's age_in_months(), so the UI and the placement job agree.
export function ageInMonths(dob: string, today = new Date()): number | null {
  const [y, m, d] = dob.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  let months = (today.getFullYear() - y) * 12 + (today.getMonth() + 1 - m);
  if (today.getDate() < d) months -= 1;
  return months;
}

// The band a child of this age belongs to (mirrors age_band_for() in SQL).
export function ageBandFor(months: number): AgeGroup {
  if (months < 18) return "nido_0_1_5";
  if (months < 36) return "toddler_1_5_3";
  if (months < 72) return "primary_3_6";
  if (months < 108) return "lower_7_9";
  return "upper_9_12";
}

type RangedRoom = {
  name: string;
  sort_order: number;
  min_age_months: number | null;
  max_age_months: number | null;
};

// The first room (by sort order) whose age range contains this age — the room
// automatic placement would choose. Rooms without a full range never match.
export function roomForAge<T extends RangedRoom>(rooms: T[], months: number): T | null {
  return (
    [...rooms]
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .find(
        (r) =>
          r.min_age_months != null &&
          r.max_age_months != null &&
          months >= r.min_age_months &&
          months < r.max_age_months,
      ) ?? null
  );
}

// Months as years to one decimal place: 18 -> "1.5", 36 -> "3".
function yearsLabel(months: number): string {
  return String(Math.round((months / 12) * 10) / 10);
}

// "3–6 years" for a classroom's range, or null when it has none.
export function formatAgeRange(min: number | null, max: number | null): string | null {
  if (min == null || max == null) return null;
  return `${yearsLabel(min)}–${yearsLabel(max)} years`;
}

// "4 yrs 2 mos" for a child's current age.
export function formatAge(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} ${y === 1 ? "yr" : "yrs"}`);
  if (m || !y) parts.push(`${m} ${m === 1 ? "mo" : "mos"}`);
  return parts.join(" ");
}

// Readable label for a stored age_group; falls back to the raw value.
export function ageGroupLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return AGE_GROUP_LABELS[value as AgeGroup] ?? value;
}
