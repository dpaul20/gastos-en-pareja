import type { FixedInstanceStatus } from "./balance";

/**
 * Whether an instance currently in `status` may transition to
 * AWAITING_BILL — the per-instance "un mes Expensas no llegó" override
 * (independent of the template's own `awaits_bill` flag).
 *
 * Only a currently-BILLED instance (`CONFIRMED` or legacy
 * `PENDING_CONFIRMATION`) is eligible. An instance that is already
 * AWAITING_BILL has nothing to revert — allowing the transition anyway
 * would silently no-op while masking the real problem: the caller's view
 * of the instance was stale (e.g. a concurrent `loadFixedExpenseBill`
 * already ran, or another tab already marked it).
 *
 * Deliberate decision: `paid` is NOT part of this predicate. A
 * `paid=true` instance MAY still be reverted — the caller
 * (`markFixedExpenseInstanceAwaitingBill`) clears `paid`,
 * `paid_by_user_id`, and `billed_at` alongside `amount_override` on every
 * revert, so a paid-but-wrong entry can still be corrected without
 * leaving a paid-but-unpriced inconsistency behind.
 *
 * `status` is typed as plain `string` (see `FixedInstanceStatus` in
 * `balance.ts`'s honesty note) — this predicate accepts that directly
 * rather than forcing an unsafe cast at call sites.
 */
export function canMarkAwaitingBill(status: string): boolean {
  return status !== "AWAITING_BILL";
}

/**
 * The status a freshly-generated monthly instance starts in, from its
 * template's flags. Precedence, highest first:
 *   1. `awaits_bill`             → AWAITING_BILL (bill hasn't arrived; unpriced)
 *   2. `requires_monthly_review` → PENDING_CONFIRMATION (legacy review flag)
 *   3. otherwise                 → CONFIRMED
 *
 * `awaits_bill` wins over the (legacy, being-removed) review flag: a template
 * that hasn't got its bill yet must start unpriced regardless of review state.
 *
 * Single source of truth for this precedence — it was previously inlined as a
 * nested ternary at three call sites in `expenses.ts`, where the copies could
 * silently drift. Nullish/undefined flags (DB nulls, partial payloads) count
 * as false.
 */
export function resolveInitialInstanceStatus(template: {
  awaits_bill?: boolean | null;
  requires_monthly_review?: boolean | null;
}): FixedInstanceStatus {
  if (template.awaits_bill) return "AWAITING_BILL";
  if (template.requires_monthly_review) return "PENDING_CONFIRMATION";
  return "CONFIRMED";
}
