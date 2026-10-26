// Child Materials — shared vocabulary for the per-child document shelf.
//
// Client-safe: no `server-only`, no supabase, no cloudinary. The upload action,
// the teacher shelf and the parent shelf all read their labels and their
// accept/size rules from here so the three never drift apart.
//
// Not to be confused with the Resource Library (src/lib/db/resources.ts), which
// publishes one row to every parent in the school.

export const MATERIAL_CATEGORIES = [
  "resource",
  "worksheet",
  "assessment",
  "medical",
  "admin",
  "other",
] as const;

export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  resource: "Learning resource",
  worksheet: "Worksheet",
  assessment: "Assessment",
  medical: "Health & medical",
  admin: "Admin & forms",
  other: "Other",
};

export function isMaterialCategory(value: string): value is MaterialCategory {
  return (MATERIAL_CATEGORIES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// File types
// ---------------------------------------------------------------------------

/**
 * What a teacher may upload. PDFs and Word documents are the point of the
 * feature; the rest are the formats schools send home alongside them.
 */
export const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "rtf",
  "odt",
  "txt",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "webp",
] as const;

/** The `accept` attribute for the file input. */
export const MATERIAL_ACCEPT = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");

/** Cap before base64 inflation — see serverActions.bodySizeLimit in next.config. */
export const MAX_MATERIAL_BYTES = 10 * 1024 * 1024;

/** "Report.FINAL.docx" -> "docx". Lowercase, no dot, "" when there is none. */
export function fileExtension(fileName: string): string {
  const match = /\.([A-Za-z0-9]{1,8})$/.exec(fileName.trim());
  return match ? match[1].toLowerCase() : "";
}

export function isAllowedExtension(ext: string): boolean {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

/** Groups the long extension list into the few kinds the UI colours and names. */
export type MaterialKind = "pdf" | "word" | "slides" | "sheet" | "image" | "text";

export function materialKind(ext: string): MaterialKind {
  switch (ext) {
    case "pdf":
      return "pdf";
    case "doc":
    case "docx":
    case "rtf":
    case "odt":
      return "word";
    case "ppt":
    case "pptx":
      return "slides";
    case "xls":
    case "xlsx":
    case "csv":
      return "sheet";
    case "png":
    case "jpg":
    case "jpeg":
    case "webp":
      return "image";
    default:
      return "text";
  }
}

export const MATERIAL_KIND_LABELS: Record<MaterialKind, string> = {
  pdf: "PDF",
  word: "Word document",
  slides: "Slides",
  sheet: "Spreadsheet",
  image: "Image",
  text: "Document",
};

/** Tailwind classes for the file tile, keyed by kind. */
export const MATERIAL_KIND_TONES: Record<MaterialKind, string> = {
  pdf: "bg-rose-50 text-rose-600 border-rose-100",
  word: "bg-sky-50 text-sky-600 border-sky-100",
  slides: "bg-amber-50 text-amber-600 border-amber-100",
  sheet: "bg-emerald-50 text-emerald-600 border-emerald-100",
  image: "bg-violet-50 text-violet-600 border-violet-100",
  text: "bg-slate-50 text-slate-500 border-slate-100",
};

/** Only these open in a browser tab; everything else downloads. */
export function opensInline(ext: string): boolean {
  const kind = materialKind(ext);
  return kind === "pdf" || kind === "image" || ext === "txt";
}

/** 1536 -> "1.5 KB". Null/0 reads as an em dash. */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

/** The in-app URL a material is read through — never the storage URL. */
export function materialHref(id: string, download = false): string {
  return `/api/child-materials/${id}${download ? "?download=1" : ""}`;
}
