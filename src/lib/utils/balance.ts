import type { Database } from "@/types/database";

type Income = Database["public"]["Tables"]["incomes"]["Row"];
type InstallmentPurchase =
  Database["public"]["Tables"]["installment_purchases"]["Row"];
type FixedExpenseInstance =
  Database["public"]["Tables"]["fixed_expense_instances"]["Row"] & {
    fixed_expense_templates: Database["public"]["Tables"]["fixed_expense_templates"]["Row"];
  };
type VariableExpense = Database["public"]["Tables"]["variable_expenses"]["Row"];

export interface PersonBalance {
  userId: string;
  percentage: number;
  obligation: number;
  actualPaid: number;
  netBalance: number; // positive = overpaid, negative = owes
}

export interface MonthlyBalance {
  totalIncome: number;
  totalExpenses: number;
  sharedExpensesTotal: number;
  savingsCapacity: number;
  installmentTotal: number;
  fixedTotal: number;
  variableTotal: number;
  variableSharedTotal: number;
  variableIndividualTotal: number;
  balances: PersonBalance[];
  debtor: string | null; // userId who owes
  creditor: string | null; // userId who is owed
  debtAmount: number;
}

export function calculateMonthlyBalance(params: {
  incomes: Income[];
  installmentPurchases: InstallmentPurchase[];
  fixedExpenseInstances: FixedExpenseInstance[];
  variableExpenses: VariableExpense[];
}): MonthlyBalance {
  const {
    incomes,
    installmentPurchases,
    fixedExpenseInstances,
    variableExpenses,
  } = params;

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

  const isSharedExpense = (expense: VariableExpense): boolean =>
    expense.is_shared ?? true;

  // Monthly installment cost = round(total_amount / installments) per purchase
  // Rounding per-purchase avoids accumulated floating point drift
  // auto_renew purchases are always active regardless of paid_installments
  const installmentTotal = installmentPurchases
    .filter((p) => p.auto_renew || p.paid_installments < p.installments)
    .reduce(
      (sum, p) => sum + Math.round(Number(p.total_amount) / p.installments),
      0,
    );

  // Fixed expenses: sum amounts from active templates for this month
  const fixedTotal = fixedExpenseInstances.reduce(
    (sum, i) => sum + Number(i.fixed_expense_templates.amount),
    0,
  );

  const variableTotal = variableExpenses.reduce(
    (sum, v) => sum + Number(v.amount),
    0,
  );

  const variableSharedTotal = variableExpenses
    .filter(isSharedExpense)
    .reduce((sum, v) => sum + Number(v.amount), 0);

  const variableIndividualTotal = variableTotal - variableSharedTotal;

  const totalExpenses = installmentTotal + fixedTotal + variableTotal;
  const sharedExpensesTotal =
    installmentTotal + fixedTotal + variableSharedTotal;
  const savingsCapacity = totalIncome - totalExpenses;

  const balances: PersonBalance[] = incomes.map((income) => {
    const percentage =
      totalIncome > 0 ? Number(income.amount) / totalIncome : 0;
    const obligation = percentage * sharedExpensesTotal;
    const actualPaid = variableExpenses
      .filter((v) => v.user_id === income.user_id && isSharedExpense(v))
      .reduce((sum, v) => sum + Number(v.amount), 0);
    const netBalance = actualPaid - obligation;

    return {
      userId: income.user_id,
      percentage,
      obligation,
      actualPaid,
      netBalance,
    };
  });

  // Who owes whom
  const sorted = [...balances].sort((a, b) => a.netBalance - b.netBalance);
  const debtor = sorted[0]?.netBalance < 0 ? sorted[0].userId : null;
  const creditor = debtor ? sorted.at(-1)!.userId : null;
  const debtAmount = debtor ? Math.abs(sorted[0].netBalance) : 0;

  return {
    totalIncome,
    totalExpenses,
    sharedExpensesTotal,
    savingsCapacity,
    installmentTotal,
    fixedTotal,
    variableTotal,
    variableSharedTotal,
    variableIndividualTotal,
    balances,
    debtor,
    creditor,
    debtAmount,
  };
}
