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

// Readable label for a stored age_group; falls back to the raw value.
export function ageGroupLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return AGE_GROUP_LABELS[value as AgeGroup] ?? value;
}
