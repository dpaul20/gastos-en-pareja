import type { Database } from "@/types/database";
import { billedFixedAmount, partitionByBill } from "./balance";

type Income = Database["public"]["Tables"]["incomes"]["Row"];
type InstallmentPurchase =
  Database["public"]["Tables"]["installment_purchases"]["Row"];
type FixedExpenseInstance =
  Database["public"]["Tables"]["fixed_expense_instances"]["Row"] & {
    fixed_expense_templates: Database["public"]["Tables"]["fixed_expense_templates"]["Row"];
  };
type VariableExpense = Database["public"]["Tables"]["variable_expenses"]["Row"];

export interface SummaryLineItem {
  id: string;
  label: string;
  amount: number;
}

export interface MonthSummaryLines {
  ingresos: SummaryLineItem[];
  cuotas: SummaryLineItem[];
  fijos: SummaryLineItem[];
  variables: SummaryLineItem[];
}

/**
 * Builds the read-only detail line items backing each expandable row in
 * `MonthSummaryCard` (Commit 8 — expandable summary rows). Pure transform
 * over data `useMonthlyData` already fetched — callers MUST NOT trigger a
 * new query to build this.
 *
 * Each row's line items use the same month-gated purchases and amount logic
 * as `calculateMonthlyBalance` (balance.ts), so
 * `lines.cuotas.reduce((s, l) => s + l.amount, 0) === balance.installmentTotal`
 * always holds (same for fijos/variables/ingresos) — callers should pass the
 * already-gated `activeInstallmentPurchases` list (see design R3-B), not the
 * full unfiltered `/expenses` list.
 */
export function buildMonthSummaryLines(params: {
  incomes: Income[];
  installmentPurchases: InstallmentPurchase[];
  fixedExpenseInstances: FixedExpenseInstance[];
  variableExpenses: VariableExpense[];
}): MonthSummaryLines {
  const {
    incomes,
    installmentPurchases,
    fixedExpenseInstances,
    variableExpenses,
  } = params;

  // Same partition balance.ts's fixedTotal uses — AWAITING_BILL instances
  // are excluded (not rendered at $0), so `Σ fijos === calculateMonthlyBalance().fixedTotal`
  // holds by construction, not by convention.
  const { billed: billedFixedInstances } = partitionByBill(
    fixedExpenseInstances,
  );

  return {
    ingresos: incomes.map((income, i) => ({
      id: income.id,
      label: `Ingreso ${i + 1}`,
      amount: Number(income.amount),
    })),
    // Callers pass the same month-gated purchases used by calculateMonthlyBalance.
    // Keep the final scheduled installment visible in that month's expense lines.
    cuotas: installmentPurchases.map((p) => ({
      id: p.id,
      label: p.description,
      amount: Math.round(Number(p.total_amount) / p.installments),
    })),
    fijos: billedFixedInstances.map((fi) => ({
      id: fi.id,
      label: fi.fixed_expense_templates.description,
      amount: billedFixedAmount(fi),
    })),
    variables: variableExpenses.map((v) => ({
      id: v.id,
      label: v.description,
      amount: Number(v.amount),
    })),
  };
}
