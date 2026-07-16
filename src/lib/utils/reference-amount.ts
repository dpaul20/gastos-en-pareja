import type { Database } from "@/types/database";
import { isBilled, billedFixedAmount } from "./balance";

type FixedExpenseInstance =
  Database["public"]["Tables"]["fixed_expense_instances"]["Row"] & {
    fixed_expense_templates: Database["public"]["Tables"]["fixed_expense_templates"]["Row"];
  };

/**
 * Resolves the amount to show on a `sin factura` row's dashed reference
 * line ("El mes pasado pagaste $X") — a FACT about what was actually paid
 * last month, never a forecast.
 *
 * Returns `null` (never a number) when there is nothing honest to report:
 * - no previous-month instance exists (brand-new service), or
 * - the previous-month instance was ITSELF `AWAITING_BILL` (never billed).
 *
 * The second case is the one that matters: `billedFixedAmount` reads
 * `amount_override ?? template.amount`, so calling it on an unbilled
 * instance would silently print the template's placeholder amount as if it
 * were a real fact — the exact fabrication `isBilled`/D1 exists to prevent,
 * wearing the reference line's costume instead of the totals'. Routing
 * through `isBilled` first closes that door structurally, the same way
 * `partitionByBill` does for the totals.
 */
export function resolveReferenceAmount(
  previousInstance: FixedExpenseInstance | null | undefined,
): number | null {
  if (!previousInstance) return null;
  if (!isBilled(previousInstance)) return null;
  return billedFixedAmount(previousInstance);
}
