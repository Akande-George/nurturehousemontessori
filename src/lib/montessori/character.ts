// Character profile on the progress report. Teachers rate each trait 1–5 stars;
// unrated traits are left off the printed report. Published reports mirror
// these onto progress.character_ratings (see src/lib/actions/conference.ts).
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
