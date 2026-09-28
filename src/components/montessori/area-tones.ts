import type { Area } from "@/lib/curriculum/curriculum";

// Tone sets for areas a school adds to the curriculum, cycled in creation
// order. Kept under src/components (not src/lib) on purpose: Tailwind only
// scans src/components + src/app, and these full literal class strings must be
// seen for the classes to be generated. Colours avoid the five built-in areas
// (emerald, violet, sky, amber, pink).
export const CUSTOM_AREA_TONES: { color: string; tone: Area["tone"] }[] = [
  {
    color: "teal",
    tone: {
      bg: "bg-teal-100",
      text: "text-teal-700",
      border: "border-teal-200",
      soft: "bg-teal-50",
      accent: "bg-teal-500",
    },
  },
  {
    color: "indigo",
    tone: {
      bg: "bg-indigo-100",
      text: "text-indigo-700",
      border: "border-indigo-200",
      soft: "bg-indigo-50",
      accent: "bg-indigo-500",
    },
  },
  {
    color: "orange",
    tone: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-200",
      soft: "bg-orange-50",
      accent: "bg-orange-500",
    },
  },
  {
    color: "rose",
    tone: {
      bg: "bg-rose-100",
      text: "text-rose-700",
      border: "border-rose-200",
      soft: "bg-rose-50",
      accent: "bg-rose-500",
    },
  },
  {
    color: "cyan",
    tone: {
      bg: "bg-cyan-100",
      text: "text-cyan-700",
      border: "border-cyan-200",
      soft: "bg-cyan-50",
      accent: "bg-cyan-500",
    },
  },
  {
    color: "lime",
    tone: {
      bg: "bg-lime-100",
      text: "text-lime-700",
      border: "border-lime-200",
      soft: "bg-lime-50",
      accent: "bg-lime-500",
    },
  },
  {
    color: "fuchsia",
    tone: {
      bg: "bg-fuchsia-100",
      text: "text-fuchsia-700",
      border: "border-fuchsia-200",
      soft: "bg-fuchsia-50",
      accent: "bg-fuchsia-500",
    },
  },
];
