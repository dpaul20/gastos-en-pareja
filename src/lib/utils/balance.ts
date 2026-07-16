import type { Database } from "@/types/database";

// ⚠️ Adding a status: this union is documentation, not enforcement.
// `fixed_expense_instances.status` is typed as plain `string` in
// database.ts (Supabase codegen doesn't emit a literal union for a `text`
// column backed by a CHECK constraint), so nothing here is exhaustiveness
// checked. If you add a new NON-BILLABLE status — to both this union and
// the DB's `fixed_instance_status_check` — you MUST also add it to
// `isBilled`'s exclusion below, by hand. Forgetting to do so will NOT
// produce a compile error; it will silently bill the new status at full
// weight.
export type FixedInstanceStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "AWAITING_BILL";

type Income = Database["public"]["Tables"]["incomes"]["Row"];
type InstallmentPurchase =
  Database["public"]["Tables"]["installment_purchases"]["Row"];
type FixedExpenseInstance =
  Database["public"]["Tables"]["fixed_expense_instances"]["Row"] & {
    fixed_expense_templates: Database["public"]["Tables"]["fixed_expense_templates"]["Row"];
  };
type VariableExpense = Database["public"]["Tables"]["variable_expenses"]["Row"];

/**
 * A fixed expense instance whose bill has arrived — the only shape an
 * amount may safely be read from. Obtainable only through `isBilled` /
 * `partitionByBill`, never by construction.
 */
export type BilledInstance = FixedExpenseInstance & {
  status: Exclude<FixedInstanceStatus, "AWAITING_BILL">;
};

/**
 * Counts every status EXCEPT `"AWAITING_BILL"` — a negative predicate BY
 * DESIGN (D2), so a legacy `"PENDING_CONFIRMATION"` row (the zombie-row
 * guarantee — see `balance.test.ts` "legacy PENDING_CONFIRMATION still
 * counts at full weight") keeps counting at full weight forever.
 * `=== "CONFIRMED"` would silently drop every live `PENDING_CONFIRMATION`
 * row out of the totals instead — never use the positive form here.
 *
 * Honesty note (do not remove): this predicate is NOT type-checked for
 * exhaustiveness. `status` is plain `string` (see `FixedInstanceStatus`
 * above), so if a future migration adds another non-billable status to the
 * CHECK constraint but not to this `!==` check, TypeScript will not flag
 * the omission — the new status gets billed at full weight, silently.
 */
export function isBilled(
  instance: FixedExpenseInstance,
): instance is BilledInstance {
  return instance.status !== "AWAITING_BILL";
}

/**
 * Splits fixed expense instances into billed (safe to read an amount from)
 * and awaiting (excluded from every money total). `calculateMonthlyBalance`
 * and `buildMonthSummaryLines` both partition through this single function
 * so their fijos totals agree by construction.
 */
export function partitionByBill(instances: FixedExpenseInstance[]): {
  billed: BilledInstance[];
  awaiting: FixedExpenseInstance[];
} {
  const billed: BilledInstance[] = [];
  const awaiting: FixedExpenseInstance[] = [];
  for (const instance of instances) {
    if (isBilled(instance)) {
      billed.push(instance);
    } else {
      awaiting.push(instance);
    }
  }
  return { billed, awaiting };
}

/**
 * Amount for an instance `isBilled`/`partitionByBill` has already accepted
 * as billed. You cannot call this on a raw `FixedExpenseInstance` — only on
 * a `BilledInstance`, so a null `amount_override` can never silently fall
 * back to `template.amount` on a row `isBilled` correctly rejected (the
 * original bug's exact mechanism). That guarantee is only as strong as
 * `isBilled`'s own predicate, though — see the honesty note there. This
 * function does not re-check `status` itself.
 */
export function billedFixedAmount(instance: BilledInstance): number {
  return Number(
    instance.amount_override ?? instance.fixed_expense_templates.amount,
  );
}

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
  fixedSharedTotal: number;
  fixedIndividualTotal: number;
  fixedAwaitingBillCount: number;
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

  const isSharedFixed = (instance: FixedExpenseInstance): boolean =>
    instance.fixed_expense_templates.is_shared ?? true;

  // Monthly installment cost = round(total_amount / installments) per purchase
  // Rounding per-purchase avoids accumulated floating point drift
  // auto_renew purchases are always active regardless of paid_installments
  const installmentTotal = installmentPurchases
    .filter((p) => p.auto_renew || p.paid_installments < p.installments)
    .reduce(
      (sum, p) => sum + Math.round(Number(p.total_amount) / p.installments),
      0,
    );

  // AWAITING_BILL instances ("sin factura") are excluded from every money
  // total below — their amount is unknown, not zero. Both partitions come
  // from the same `partitionByBill` call `buildMonthSummaryLines` also uses,
  // so the two totals agree by construction (see summary-lines.ts).
  const { billed: billedFixedInstances, awaiting: awaitingFixedInstances } =
    partitionByBill(fixedExpenseInstances);
  const fixedAwaitingBillCount = awaitingFixedInstances.length;

  // Fixed expenses: sum effective amounts (override ?? template) for this month.
  // Only shared fixed expenses enter the proportional split; personal ones
  // belong to their owner and stay out of the settlement (like personal variables).
  const fixedTotal = billedFixedInstances.reduce(
    (sum, i) => sum + billedFixedAmount(i),
    0,
  );

  const fixedSharedTotal = billedFixedInstances
    .filter(isSharedFixed)
    .reduce((sum, i) => sum + billedFixedAmount(i), 0);

  const fixedIndividualTotal = fixedTotal - fixedSharedTotal;

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
    installmentTotal + fixedSharedTotal + variableSharedTotal;
  const savingsCapacity = totalIncome - totalExpenses;

  const balances: PersonBalance[] = incomes.map((income) => {
    const percentage =
      totalIncome > 0 ? Number(income.amount) / totalIncome : 0;
    const obligation = percentage * sharedExpensesTotal;
    const actualPaidVariable = variableExpenses
      .filter((v) => v.user_id === income.user_id && isSharedExpense(v))
      .reduce((sum, v) => sum + Number(v.amount), 0);

    const actualPaidFixed = billedFixedInstances
      .filter(
        (fi) =>
          fi.paid && fi.paid_by_user_id === income.user_id && isSharedFixed(fi),
      )
      .reduce((sum, fi) => sum + billedFixedAmount(fi), 0);

    const actualPaidInstallments = installmentPurchases
      .filter(
        (p) =>
          p.paid_by_user_id === income.user_id &&
          (p.auto_renew || p.paid_installments < p.installments),
      )
      .reduce(
        (sum, p) => sum + Math.round(Number(p.total_amount) / p.installments),
        0,
      );

    const actualPaid =
      actualPaidVariable + actualPaidFixed + actualPaidInstallments;
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
    fixedSharedTotal,
    fixedIndividualTotal,
    fixedAwaitingBillCount,
    variableTotal,
    variableSharedTotal,
    variableIndividualTotal,
    balances,
    debtor,
    creditor,
    debtAmount,
  };
}
