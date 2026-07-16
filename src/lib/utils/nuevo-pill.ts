/**
 * Window during which a freshly-loaded bill shows the "nuevo" pill
 * (decision 399). There is no `updated_at`/`confirmed_at` column to derive
 * a true "since you last looked" signal from — 48h off `billed_at` is the
 * accepted approximation.
 */
export const NUEVO_PILL_WINDOW_MS = 48 * 60 * 60 * 1000;

/**
 * Whether the "nuevo" pill (DS `Badge variant="accent"`) should render for
 * a fixed expense instance.
 *
 * Gates on TWO independent conditions, not `billed_at` alone:
 *   1. `status === "CONFIRMED"` — an AWAITING_BILL instance can carry a
 *      STALE `billed_at` from before it was reverted by
 *      `markFixedExpenseInstanceAwaitingBill`. PR2's fix batch clears
 *      `billed_at` on revert, but this predicate does not rely on that
 *      alone: the status check is a second, independent guard so a future
 *      code path that reverts without clearing `billed_at` (or a row
 *      mutated directly in the DB) still can't light the pill. Also
 *      excludes the legacy `PENDING_CONFIRMATION` status — only a real
 *      "just loaded a bill" transition qualifies.
 *   2. `billed_at` is within `NUEVO_PILL_WINDOW_MS` (48h) of `now` — a
 *      half-open window `[0, 48h)`: the boundary itself does not show the
 *      pill, and a `billed_at` in the future (clock skew, malformed data)
 *      is treated as invalid, not "brand new".
 */
export function shouldShowNuevoPill(
  instance: { status: string; billed_at: string | null },
  now: Date = new Date(),
): boolean {
  if (instance.status !== "CONFIRMED") return false;
  if (!instance.billed_at) return false;

  const billedAtMs = new Date(instance.billed_at).getTime();
  if (Number.isNaN(billedAtMs)) return false;

  const elapsed = now.getTime() - billedAtMs;
  return elapsed >= 0 && elapsed < NUEVO_PILL_WINDOW_MS;
}
