import { describe, it, expect } from "vitest";
import { buildMonthSummaryLines } from "../summary-lines";
import type { Database } from "@/types/database";

type Income = Database["public"]["Tables"]["incomes"]["Row"];
type InstallmentPurchase =
  Database["public"]["Tables"]["installment_purchases"]["Row"];
type FixedExpenseTemplate =
  Database["public"]["Tables"]["fixed_expense_templates"]["Row"];
type FixedExpenseInstance =
  Database["public"]["Tables"]["fixed_expense_instances"]["Row"] & {
    fixed_expense_templates: FixedExpenseTemplate;
  };
type VariableExpense = Database["public"]["Tables"]["variable_expenses"]["Row"];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function makeIncome(overrides: Partial<Income> = {}): Income {
  return {
    id: "inc-1",
    couple_id: "c1",
    user_id: "u1",
    amount: 100_000,
    month: "2026-07-01",
    created_at: "",
    ...overrides,
  };
}

function makePurchase(
  overrides: Partial<InstallmentPurchase> = {},
): InstallmentPurchase {
  return {
    id: "p-1",
    couple_id: "c1",
    category_id: null,
    credit_card: null,
    card_id: null,
    description: "Notebook",
    total_amount: 120_000,
    installments: 12,
    paid_installments: 0,
    auto_renew: false,
    first_payment_date: "2026-06-10",
    created_at: "",
    paid_by_user_id: null,
    ...overrides,
  };
}

function makeTemplate(
  overrides: Partial<FixedExpenseTemplate> = {},
): FixedExpenseTemplate {
  return {
    id: "tpl-1",
    couple_id: "c1",
    category_id: null,
    description: "Alquiler",
    amount: 100_000,
    due_day: 10,
    active: true,
    is_shared: true,
    owner_user_id: null,
    requires_monthly_review: false,
    created_at: "",
    ...overrides,
  };
}

function makeInstance(
  overrides: Partial<FixedExpenseInstance> = {},
  template: FixedExpenseTemplate = makeTemplate(),
): FixedExpenseInstance {
  return {
    id: "fi-1",
    couple_id: "c1",
    template_id: template.id,
    month: "2026-07-01",
    due_day: null,
    paid: false,
    paid_by_user_id: null,
    amount_override: null,
    status: "CONFIRMED",
    created_at: "",
    fixed_expense_templates: template,
    ...overrides,
  };
}

function makeVariable(
  overrides: Partial<VariableExpense> = {},
): VariableExpense {
  return {
    id: "v-1",
    couple_id: "c1",
    category_id: null,
    user_id: "u1",
    description: "Supermercado",
    amount: 15_000,
    date: "2026-07-05",
    is_shared: true,
    created_at: "",
    ...overrides,
  };
}

// ── TESTS ────────────────────────────────────────────────────────────────────

describe("buildMonthSummaryLines", () => {
  it("mapea cada income a una línea con su monto", () => {
    const result = buildMonthSummaryLines({
      incomes: [makeIncome({ id: "i1", amount: 100_000 })],
      installmentPurchases: [],
      fixedExpenseInstances: [],
      variableExpenses: [],
    });

    expect(result.ingresos).toHaveLength(1);
    expect(result.ingresos[0]).toMatchObject({ id: "i1", amount: 100_000 });
  });

  it("mapea cuotas usando round(total_amount/installments) — igual que balance.ts", () => {
    const result = buildMonthSummaryLines({
      incomes: [],
      installmentPurchases: [
        makePurchase({ id: "p1", total_amount: 120_000, installments: 12 }),
      ],
      fixedExpenseInstances: [],
      variableExpenses: [],
    });

    expect(result.cuotas).toHaveLength(1);
    expect(result.cuotas[0]).toMatchObject({
      id: "p1",
      label: "Notebook",
      amount: 10_000,
    });
  });

  it("excluye cuotas terminadas (no auto_renew, paid_installments >= installments) — igual que balance.ts", () => {
    const result = buildMonthSummaryLines({
      incomes: [],
      installmentPurchases: [
        makePurchase({
          id: "p1",
          installments: 6,
          paid_installments: 6,
          auto_renew: false,
        }),
      ],
      fixedExpenseInstances: [],
      variableExpenses: [],
    });

    expect(result.cuotas).toHaveLength(0);
  });

  it("incluye cuotas auto_renew aunque paid_installments >= installments", () => {
    const result = buildMonthSummaryLines({
      incomes: [],
      installmentPurchases: [
        makePurchase({
          id: "p1",
          installments: 6,
          paid_installments: 6,
          auto_renew: true,
        }),
      ],
      fixedExpenseInstances: [],
      variableExpenses: [],
    });

    expect(result.cuotas).toHaveLength(1);
  });

  it("mapea fijos usando effectiveFixedAmount (amount_override ?? template.amount)", () => {
    const template = makeTemplate({ description: "Alquiler", amount: 100_000 });
    const result = buildMonthSummaryLines({
      incomes: [],
      installmentPurchases: [],
      fixedExpenseInstances: [
        makeInstance({ id: "fi1", amount_override: 110_000 }, template),
      ],
      variableExpenses: [],
    });

    expect(result.fijos).toHaveLength(1);
    expect(result.fijos[0]).toMatchObject({
      id: "fi1",
      label: "Alquiler",
      amount: 110_000,
    });
  });

  it("mapea variables 1:1 con su descripción y monto", () => {
    const result = buildMonthSummaryLines({
      incomes: [],
      installmentPurchases: [],
      fixedExpenseInstances: [],
      variableExpenses: [
        makeVariable({ id: "v1", description: "Supermercado", amount: 15_000 }),
      ],
    });

    expect(result.variables).toHaveLength(1);
    expect(result.variables[0]).toMatchObject({
      id: "v1",
      label: "Supermercado",
      amount: 15_000,
    });
  });

  it("listas vacías retornan arrays vacíos en las 4 categorías", () => {
    const result = buildMonthSummaryLines({
      incomes: [],
      installmentPurchases: [],
      fixedExpenseInstances: [],
      variableExpenses: [],
    });

    expect(result.ingresos).toHaveLength(0);
    expect(result.cuotas).toHaveLength(0);
    expect(result.fijos).toHaveLength(0);
    expect(result.variables).toHaveLength(0);
  });
});
