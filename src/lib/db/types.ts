import type { Database } from "./database.types";

export type Tables = Database["public"]["Tables"];
export type Enums = Database["public"]["Enums"];

export type Role = Enums["user_role"];
export type SchoolType = Enums["school_type"];
export type SchoolStatus = Enums["school_status"];
export type Term = Enums["term"];
export type InvoiceStatus = Enums["invoice_status"];
export type PromotionStatus = Enums["promotion_status"];
export type AttendanceStatus = Enums["attendance_status"];
export type CurriculumStatus = Enums["curriculum_status"];

export type Profile = Tables["profiles"]["Row"];
export type School = Tables["schools"]["Row"];
export type Membership = Tables["memberships"]["Row"];
export type Student = Tables["students"]["Row"];
export type SchoolClass = Tables["classes"]["Row"];
export type Subject = Tables["subjects"]["Row"];
export type AssessmentScore = Tables["assessment_scores"]["Row"];
export type ReportCard = Tables["report_cards"]["Row"];
export type ReportCardRow = Tables["report_card_rows"]["Row"];
export type TimetablePeriod = Tables["timetable_periods"]["Row"];
export type Homework = Tables["homework"]["Row"];
export type HomeworkSubmission = Tables["homework_submissions"]["Row"];
export type Notice = Tables["notices"]["Row"];
export type Invoice = Tables["invoices"]["Row"];
export type Attendance = Tables["attendance"]["Row"];

export const CURRENT_ACADEMIC_YEAR = "2025-2026";

export type CAComponent = { label: string; score: number; max: number };
export type ExamScore = { score: number; max: number };

// A school's brand theme (jsonb column) — RGB channel triplets.
export type SchoolTheme = { primary: string; secondary: string; accent: string };

export const DEFAULT_THEME: SchoolTheme = {
  primary: "12 92 76",
  secondary: "88 160 56",
  accent: "252 211 3",
};

export function readTheme(theme: unknown): SchoolTheme {
  if (theme && typeof theme === "object") {
    const t = theme as Record<string, unknown>;
    return {
      primary: typeof t.primary === "string" ? t.primary : DEFAULT_THEME.primary,
      secondary:
        typeof t.secondary === "string" ? t.secondary : DEFAULT_THEME.secondary,
      accent: typeof t.accent === "string" ? t.accent : DEFAULT_THEME.accent,
    };
  }
  return DEFAULT_THEME;
}
