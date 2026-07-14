import { getMonthDate } from "@/lib/utils";

/**
 * Returns true when `month` (a "YYYY-MM-01" viewed month) is on or after the
 * calendar month in which the fixed-expense template was created.
 *
 * Templates count only from their own start month forward — a template
 * created in April must never appear (or generate a
 * `fixed_expense_instances` row) for March or earlier. Both sides of the
 * comparison go through `getMonthDate`, so the comparison uses the same
 * fixed timezone (America/Argentina/Buenos_Aires) that assigns
 * `fixed_expense_instances.month` (R3-A), regardless of whether this runs
 * server-side or client-side.
 */
export function isTemplateActiveInMonth(
  templateCreatedAt: string,
  month: string,
): boolean {
  const templateStartMonth = getMonthDate(new Date(templateCreatedAt));
  return templateStartMonth <= month;
}
