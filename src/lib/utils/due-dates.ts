import type { Database } from "@/types/database";
import { isBilled } from "./balance";

type FixedExpenseInstanceRow =
  Database["public"]["Tables"]["fixed_expense_instances"]["Row"];
type FixedExpenseTemplateRow =
  Database["public"]["Tables"]["fixed_expense_templates"]["Row"];

export type FixedExpenseInstance = FixedExpenseInstanceRow & {
  fixed_expense_templates: FixedExpenseTemplateRow;
};

export interface UpcomingDue {
  instance: FixedExpenseInstance;
  dueDay: number; // effective due day (clamped to last day of month)
  daysUntilDue: number; // negative = overdue, 0 = today
  status: "overdue" | "today" | "upcoming";
}

export interface UpcomingDuesResult {
  today: UpcomingDue[];
  upcoming: UpcomingDue[]; // next windowDays days, excluding today
  overdue: UpcomingDue[]; // days past due in current month, unpaid
}

/**
 * Returns the number of days in the given month.
 * month is a JS Date month index (0-based).
 */
function daysInMonth(year: number, month: number): number {
  // Using day 0 of the next month gives last day of this month
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Clamps a raw due-day (e.g. template due_day = 31) to the last valid day of
 * the month containing `referenceDate`. This is the single source of truth
 * for "effective due day" so the dashboard and /expenses always render the
 * same value for the same service and month.
 */
export function clampDueDay(rawDay: number, referenceDate: Date): number {
  const lastDay = daysInMonth(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
  );
  return Math.min(rawDay, lastDay);
}

/**
 * Classifies fixed expense instances into today / upcoming / overdue buckets
 * based on their `due_day` relative to `today`.
 *
 * - Filters out `paid = true` instances.
 * - Clamps `due_day = 31` (or any value > last day) to last day of the month.
 * - `today[]`  : effective due_day === today.getDate()
 * - `upcoming[]`: effective due_day > today && effective due_day <= today + windowDays
 * - `overdue[]` : effective due_day < today (earlier this month, still unpaid)
 * - Items outside all buckets (due_day > today + windowDays) are not returned.
 * - Each bucket is sorted by dueDay ascending.
 */
export function getUpcomingDues(
  instances: readonly FixedExpenseInstance[],
  today: Date,
  windowDays = 7,
): UpcomingDuesResult {
  const todayDay = today.getDate();

  const result: UpcomingDuesResult = { today: [], upcoming: [], overdue: [] };

  for (const instance of instances) {
    if (instance.paid) continue;
    // "sin factura" (AWAITING_BILL) instances have no bill yet: no amount and
    // nothing to pay, so they can never be "due" or "overdue" — showing one as
    // "vencido" (and offering a Pagar button that would mark a non-existent
    // bill paid) is the bug this guards. They surface in /expenses' sin-factura
    // row instead. Keyed off isBilled (status !== AWAITING_BILL) so legacy
    // PENDING_CONFIRMATION rows, which DO carry an amount, still appear here.
    if (!isBilled(instance)) continue;

    const rawDueDay =
      instance.due_day ?? instance.fixed_expense_templates.due_day;
    const dueDay = clampDueDay(rawDueDay, today);
    const daysUntilDue = dueDay - todayDay;

    let status: UpcomingDue["status"];
    if (daysUntilDue === 0) {
      status = "today";
    } else if (daysUntilDue > 0 && daysUntilDue <= windowDays) {
      status = "upcoming";
    } else if (daysUntilDue < 0) {
      status = "overdue";
    } else {
      // daysUntilDue > windowDays — outside reporting window, skip
      continue;
    }

    const due: UpcomingDue = { instance, dueDay, daysUntilDue, status };

    if (status === "today") result.today.push(due);
    else if (status === "upcoming") result.upcoming.push(due);
    else result.overdue.push(due);
  }

  const byDueDay = (a: UpcomingDue, b: UpcomingDue) => a.dueDay - b.dueDay;
  result.today.sort(byDueDay);
  result.upcoming.sort(byDueDay);
  result.overdue.sort(byDueDay);

  return result;
}
