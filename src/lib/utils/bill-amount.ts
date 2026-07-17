/**
 * Upper bound for a "Cargar factura" amount, in ARS. This is a defense
 * against fat-fingered or malformed input feeding straight into
 * `balance.ts`'s proportional-splitting math (e.g. an extra digit —
 * $723.750.000 instead of $72.375 — would silently blow up a couple's
 * totals with no other guard catching it).
 *
 * Picked generously above any real household fixed-expense line the
 * app's own worked examples show (largest today: Epec at $72.375) —
 * 10.000.000 ARS is roughly 138x that, leaving headroom for inflation
 * over the years without meaningfully constraining legitimate use.
 */
export const MAX_BILL_AMOUNT = 10_000_000;

/**
 * Validates an amount for `loadFixedExpenseBill`: finite, strictly
 * positive, and no greater than `MAX_BILL_AMOUNT`.
 */
export function isValidBillAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= MAX_BILL_AMOUNT;
}
