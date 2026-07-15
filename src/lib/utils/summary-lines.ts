import type { Database } from "@/types/database";
import { effectiveFixedAmount } from "./balance";

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
 * Each row's line items are computed with the EXACT SAME filter/amount logic
 * `calculateMonthlyBalance` (balance.ts) uses for that row's total, so
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

  return {
    ingresos: incomes.map((income, i) => ({
      id: income.id,
      label: `Ingreso ${i + 1}`,
      amount: Number(income.amount),
    })),
    // Mirrors balance.ts's installmentTotal filter exactly (auto_renew
    // purchases are always active; others drop out once fully paid).
    cuotas: installmentPurchases
      .filter((p) => p.auto_renew || p.paid_installments < p.installments)
      .map((p) => ({
        id: p.id,
        label: p.description,
        amount: Math.round(Number(p.total_amount) / p.installments),
      })),
    fijos: fixedExpenseInstances.map((fi) => ({
      id: fi.id,
      label: fi.fixed_expense_templates.description,
      amount: effectiveFixedAmount(fi),
    })),
    variables: variableExpenses.map((v) => ({
      id: v.id,
      label: v.description,
      amount: Number(v.amount),
    })),
  };
}
