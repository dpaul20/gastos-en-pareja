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
