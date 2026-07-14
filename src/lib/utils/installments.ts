import { getMonthDate } from "@/lib/utils";
import type { Database } from "@/types/database";

type InstallmentPurchaseRow =
  Database["public"]["Tables"]["installment_purchases"]["Row"];
type CardRow = Database["public"]["Tables"]["cards"]["Row"];
type InstallmentMonthOverrideRow =
  Database["public"]["Tables"]["installment_month_overrides"]["Row"];

/**
 * Computes the per-month installment amount for a purchase.
 *
 * - Returns 0 for invalid installment counts (0 or negative).
 * - Rounds to the nearest integer (Math.round).
 */
export function computeMonthlyInstallment(
  totalAmount: number,
  installments: number,
): number {
  if (installments <= 0) return 0;
  return Math.round(totalAmount / installments);
}

// ── BUG 1 (LEAK A) — MONTH GATING (R3-B) ────────────────────────────────────

/**
 * Normalizes any "YYYY-MM-DD" date string to the first day of its month
 * ("YYYY-MM-01"). Pure string parsing — no `Date` object involved, so it is
 * deterministic regardless of the runtime's ambient timezone (the inputs are
 * already calendar date strings, not instants; there is nothing to convert).
 */
export function startOfMonth(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  return `${year}-${month}-01`;
}

/**
 * Number of calendar months between two "YYYY-MM..." strings (`toMonth` minus
 * `fromMonth`). Pure integer arithmetic on the parsed year/month — same
 * ambient-TZ-independence rationale as `startOfMonth`.
 */
export function monthsBetween(fromMonth: string, toMonth: string): number {
  const [fromYear, fromMonthNum] = fromMonth.split("-").map(Number);
  const [toYear, toMonthNum] = toMonth.split("-").map(Number);
  return (toYear - fromYear) * 12 + (toMonthNum - fromMonthNum);
}

/**
 * Gates whether a purchase counts toward a given month's TOTALS. Keyed
 * exclusively on the SELECTED month (never on `today` — see spec "Totals
 * Gating Uses the Selected Month" / design R3-B): a purchase is active from
 * its own first-payment month onward, for `installments` months (or forever
 * if `auto_renew`).
 */
export function isInstallmentActiveInMonth(
  purchase: Pick<
    InstallmentPurchaseRow,
    "first_payment_date" | "installments" | "auto_renew"
  >,
  month: string,
): boolean {
  const idx = monthsBetween(startOfMonth(purchase.first_payment_date), month);
  return idx >= 0 && (purchase.auto_renew || idx < purchase.installments);
}

/**
 * Gates whether a card+payment_day purchase's installment number is
 * COMPUTED (auto-advanced from `first_payment_date`) versus falling back to
 * the manual `paid_installments` counter (design R3-D/R3-E). This is the
 * single source of truth for that decision — both `installmentNumberForMonth`
 * and the UI (hide the +1 stepper, show "Corregir número") must derive the
 * same boolean from this function rather than re-deriving the condition.
 */
export function isCardComputedInstallment(
  purchase: Pick<InstallmentPurchaseRow, "card_id">,
  card: Pick<CardRow, "payment_day"> | null,
): card is Pick<CardRow, "payment_day"> & { payment_day: number } {
  return !!purchase.card_id && !!card && card.payment_day != null;
}

/**
 * Resolves the DISPLAYED installment number for a card+payment_day purchase
 * in a given month (spec: "Automatic Advance With Manual Override";
 * design R3-B/R3-D/R3-F). Precedence:
 *   1. A stored `installment_month_overrides` row for this (purchase, month)
 *      always wins — a manual correction persists.
 *   2. No `card_id`, no card, or a card with no `payment_day` set — fall
 *      back to the manual `paid_installments` counter unchanged.
 *   3. Otherwise compute from the month index since `first_payment_date`
 *      (wrapping via modulo for `auto_renew` purchases), then, ONLY for the
 *      real current calendar month, decrement by one if the card's
 *      `payment_day` hasn't happened yet this month — floored at 1.
 *
 * `today` is intentionally irrelevant to every month except the real current
 * one (R3-B): it never changes which months a purchase is active in.
 *
 * This is the SINGLE SOURCE every cuota-item.tsx read (isPaid, label, badge,
 * progressbar aria-valuenow/width) must call — never re-derive the number
 * from `paid_installments` directly for a card+payment_day purchase (R3-E).
 */
export function installmentNumberForMonth(
  purchase: Pick<
    InstallmentPurchaseRow,
    | "first_payment_date"
    | "installments"
    | "auto_renew"
    | "paid_installments"
    | "card_id"
  >,
  card: Pick<CardRow, "payment_day"> | null,
  month: string,
  override: Pick<InstallmentMonthOverrideRow, "installment_number"> | null,
  today: Date,
): number {
  if (override) return override.installment_number;

  if (!isCardComputedInstallment(purchase, card)) {
    return purchase.paid_installments;
  }

  const idx = monthsBetween(startOfMonth(purchase.first_payment_date), month);
  let installmentNumber = purchase.auto_renew
    ? (idx % purchase.installments) + 1
    : idx + 1;

  const currentMonth = getMonthDate(today);
  if (month === currentMonth && today.getDate() < card.payment_day) {
    installmentNumber -= 1;
  }

  return Math.max(1, installmentNumber);
}
