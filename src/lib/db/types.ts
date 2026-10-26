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
export type ConferenceReportStatus = Enums["conference_report_status"];

export type Profile = Tables["profiles"]["Row"];
export type School = Tables["schools"]["Row"];
export type Membership = Tables["memberships"]["Row"];
export type Student = Tables["students"]["Row"];
export type SchoolClass = Tables["classes"]["Row"];
export type Classroom = Tables["classrooms"]["Row"];
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
export type ConferenceReport = Tables["conference_reports"]["Row"];
export type ChildMaterial = Tables["child_materials"]["Row"];

export const CURRENT_ACADEMIC_YEAR = "2025-2026";

// One row on an invoice (jsonb `line_items` column).
export type InvoiceLineItem = { description: string; amount_cents: number };

// Parse an invoice's line items; single-line invoices created before the
// line_items column existed fall back to their description + pre-tax amount.
export function invoiceLineItems(invoice: Invoice): InvoiceLineItem[] {
  const raw = Array.isArray(invoice.line_items) ? invoice.line_items : [];
  const items = raw.filter(
    (item): item is InvoiceLineItem =>
      !!item &&
      typeof item === "object" &&
      typeof (item as InvoiceLineItem).description === "string" &&
      typeof (item as InvoiceLineItem).amount_cents === "number",
  );
  if (items.length > 0) return items;
  return [
    {
      description: invoice.description,
      amount_cents: invoice.amount_cents - (invoice.tax_cents ?? 0),
    },
  ];
}

// ---------------------------------------------------------------------------
// Payment position
// ---------------------------------------------------------------------------

// "Part paid" is derived from the amounts rather than stored, so `status` stays
// a two-value enum and an invoice only reads as `paid` once nothing is owed.
export type InvoicePaymentState = "unpaid" | "part_paid" | "paid";

export type InvoicePayment = {
  total: number;
  paid: number;
  balance: number;
  state: InvoicePaymentState;
  /** Date the remainder falls due; null when nothing is outstanding. */
  balanceDueDate: string | null;
  /** Remark typed by the office when recording a payment. */
  note: string | null;
};

/**
 * The single source of truth for an invoice's money position. Every screen —
 * admin ledger, parent list and the printed document — reads this rather than
 * doing its own arithmetic.
 *
 * `amount_paid_cents` is clamped into 0..total so a bad row can never render a
 * negative balance, and a legacy invoice marked `paid` before the column
 * existed still reports as fully paid.
 */
export function invoicePayment(invoice: Invoice): InvoicePayment {
  const total = Math.max(0, invoice.amount_cents ?? 0);
  const recorded = Math.max(0, Math.min(invoice.amount_paid_cents ?? 0, total));
  // Invoices settled before part-payments existed carry no recorded amount.
  const paid = invoice.status === "paid" ? total : recorded;
  const balance = Math.max(0, total - paid);

  const state: InvoicePaymentState =
    balance === 0 && total > 0 ? "paid" : paid > 0 ? "part_paid" : "unpaid";

  return {
    total,
    paid,
    balance,
    state,
    balanceDueDate: balance > 0 ? invoice.balance_due_date ?? null : null,
    note: invoice.payment_note?.trim() || null,
  };
}

/** Label shown on status chips. */
export const INVOICE_STATE_LABEL: Record<InvoicePaymentState, string> = {
  unpaid: "Unpaid",
  part_paid: "Part paid",
  paid: "Paid",
};

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
