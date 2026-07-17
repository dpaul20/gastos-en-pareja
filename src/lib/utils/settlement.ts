import type { Database } from "@/types/database";
import { calculateMonthlyBalance } from "./balance";

type Income = Database["public"]["Tables"]["incomes"]["Row"];
type InstallmentPurchase =
  Database["public"]["Tables"]["installment_purchases"]["Row"];
type FixedExpenseInstance =
  Database["public"]["Tables"]["fixed_expense_instances"]["Row"] & {
    fixed_expense_templates: Database["public"]["Tables"]["fixed_expense_templates"]["Row"];
  };
type VariableExpense = Database["public"]["Tables"]["variable_expenses"]["Row"];

/**
 * Minimal shape this module needs from a `settlements` row. Deliberately NOT
 * the full DB row — `note`/`created_at`/`created_by` etc. are UI/audit
 * concerns, not math inputs.
 */
export interface Settlement {
  from_user_id: string;
  to_user_id: string;
  amount: number;
}

export interface SettlementSummary {
  /** Who the ledger is signed against, or `null` when there is nothing to
   * report (no debtor and no settlements). A negative `remainingDebt` means
   * the roles are effectively reversed — this field never flips itself. */
  direction: { debtor: string; creditor: string } | null;
  /** Sum of every settlement recorded, signed against `direction` (debtor
   * -> creditor is positive, a reverse settlement is negative). Never a net
   * of "the latest" — always the running total of every entry. */
  settledTotal: number;
  /** `debtAmount - settledTotal`. Never clamped to zero — see spec
   * "Remaining Debt May Go Negative". */
  remainingDebt: number;
  /** Every settlement passed in, unmodified — the ledger renders each
   * entry, never a net (design D3 / mockup contract). */
  entries: Settlement[];
}

/**
 * Layers settlements on top of `calculateMonthlyBalance`'s output. THE
 * STRUCTURAL INVARIANT (design D3): this function's parameter type accepts
 * ONLY `debtor`, `creditor`, `debtAmount`, and `settlements` — never
 * `actualPaid`, `obligation`, or `netBalance`. There is no way to fold a
 * settlement into expense attribution through this signature; that is not a
 * convention, it is unwritable without a diff to this type a reviewer would
 * see. `calculateMonthlyBalance` itself has no `settlements` parameter at
 * all — it never even sees this table.
 */
export function summarizeSettlements(params: {
  debtor: string | null;
  creditor: string | null;
  debtAmount: number;
  settlements: Settlement[];
}): SettlementSummary {
  const { debtor, creditor, debtAmount, settlements } = params;

  if (settlements.length === 0) {
    return {
      direction: debtor && creditor ? { debtor, creditor } : null,
      settledTotal: 0,
      remainingDebt: debtor ? debtAmount : 0,
      entries: [],
    };
  }

  // A real debtor (from calculateMonthlyBalance) wins. When the month is
  // balanced (no debtor) but a settlement was recorded anyway, the FIRST
  // entry establishes the direction the rest are signed against — see spec
  // "Settlement with no debtor": a stray settlement on a balanced month must
  // not require a pre-existing debtor to make sense.
  const resolvedDebtor = debtor ?? settlements[0].from_user_id;
  const resolvedCreditor = creditor ?? settlements[0].to_user_id;

  const settledTotal = settlements.reduce((sum, s) => {
    if (
      s.from_user_id === resolvedDebtor &&
      s.to_user_id === resolvedCreditor
    ) {
      return sum + Number(s.amount);
    }
    if (
      s.from_user_id === resolvedCreditor &&
      s.to_user_id === resolvedDebtor
    ) {
      return sum - Number(s.amount);
    }
    // Defensive only: a two-person couple never has a settlement between
    // parties outside {resolvedDebtor, resolvedCreditor}. Never silently
    // drop recorded money — treat as same-direction rather than ignore it.
    return sum + Number(s.amount);
  }, 0);

  return {
    direction: { debtor: resolvedDebtor, creditor: resolvedCreditor },
    settledTotal,
    remainingDebt: debtAmount - settledTotal,
    entries: settlements,
  };
}

/**
 * Guards a settlement's core invariants before it is written: a positive,
 * finite amount and two DISTINCT parties. Pure (throws, no I/O) so it is
 * unit-tested here directly, rather than only through the Server Actions that
 * call it (`createSettlement`/`updateSettlement`), which live outside Vitest's
 * coverage. Member-of-couple validation is deliberately NOT here — that needs
 * the DB and is enforced in the action via the service client.
 */
export function assertValidSettlement(params: {
  amount: number;
  from_user_id: string;
  to_user_id: string;
}): void {
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new Error("El monto debe ser mayor a cero");
  }
  if (params.from_user_id === params.to_user_id) {
    throw new Error("No podés registrar un pago a vos mismo");
  }
}

export interface BillImpactPreview {
  currentRemainingDebt: number;
  projectedRemainingDebt: number;
  /** `projectedRemainingDebt - currentRemainingDebt` — the number the
   * reopen-warning quotes ("deja una diferencia de $X"). */
  difference: number;
}

/**
 * Powers the "Cargar factura" reopen warning (PR3's `load-bill-sheet.tsx`
 * boundary comment, closed here): re-runs `calculateMonthlyBalance` +
 * `summarizeSettlements` twice — once with the month's real data, once with
 * `instanceId` hypothetically billed at `amount` — and reports the
 * resulting `remainingDebt` delta.
 *
 * Returns `null` when there is nothing to warn about: the month wasn't
 * already settled (`currentRemainingDebt > 0`, per spec "Loading a Bill
 * Recomputes Debt" — the reopen warning is specifically for a month that
 * WAS at or below zero), or loading the bill doesn't actually reopen it
 * (`projectedRemainingDebt === 0`).
 */
export function previewBillImpact(params: {
  incomes: Income[];
  installmentPurchases: InstallmentPurchase[];
  fixedExpenseInstances: FixedExpenseInstance[];
  variableExpenses: VariableExpense[];
  settlements: Settlement[];
  instanceId: string;
  amount: number;
}): BillImpactPreview | null {
  const {
    incomes,
    installmentPurchases,
    fixedExpenseInstances,
    variableExpenses,
    settlements,
    instanceId,
    amount,
  } = params;

  const currentBalance = calculateMonthlyBalance({
    incomes,
    installmentPurchases,
    fixedExpenseInstances,
    variableExpenses,
  });
  const currentSummary = summarizeSettlements({
    debtor: currentBalance.debtor,
    creditor: currentBalance.creditor,
    debtAmount: currentBalance.debtAmount,
    settlements,
  });

  if (currentSummary.remainingDebt > 0) return null;

  const hypotheticalInstances = fixedExpenseInstances.map((instance) =>
    instance.id === instanceId
      ? { ...instance, status: "CONFIRMED", amount_override: amount }
      : instance,
  );
  const projectedBalance = calculateMonthlyBalance({
    incomes,
    installmentPurchases,
    fixedExpenseInstances: hypotheticalInstances,
    variableExpenses,
  });
  const projectedSummary = summarizeSettlements({
    debtor: projectedBalance.debtor,
    creditor: projectedBalance.creditor,
    debtAmount: projectedBalance.debtAmount,
    settlements,
  });

  if (projectedSummary.remainingDebt === 0) return null;

  return {
    currentRemainingDebt: currentSummary.remainingDebt,
    projectedRemainingDebt: projectedSummary.remainingDebt,
    difference: projectedSummary.remainingDebt - currentSummary.remainingDebt,
  };
}
