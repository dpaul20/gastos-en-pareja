import type { Database } from "@/types/database";

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
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-based
  const lastDay = daysInMonth(year, month);

  const result: UpcomingDuesResult = { today: [], upcoming: [], overdue: [] };

  for (const instance of instances) {
    if (instance.paid) continue;

    const rawDueDay = instance.fixed_expense_templates.due_day;
    const dueDay = Math.min(rawDueDay, lastDay);
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
