// Character profile for the termly report. Teachers rate each trait 1–5 stars.
export const CHARACTER_TRAITS = [
  "Concentration",
  "Independence",
  "Order",
  "Coordination",
  "Grace & Courtesy",
  "Confidence",
  "Collaboration",
  "Respect",
] as const;

export type CharacterTrait = (typeof CHARACTER_TRAITS)[number];

// Stored on progress.character_ratings as { [trait]: 1..5 }.
export type CharacterRatings = Record<string, number>;

export const RATING_MAX = 5;

export const RATING_LABELS: Record<number, string> = {
  1: "Emerging",
  2: "Developing",
  3: "Progressing",
  4: "Consolidating",
  5: "Secure",
};
