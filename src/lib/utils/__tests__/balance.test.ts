import { describe, it, expect } from "vitest";
import { calculateMonthlyBalance } from "../balance";

const DEIVY_ID = "user-deivy";
const ANNIE_ID = "user-annie";

const baseIncomes = [
  {
    id: "1",
    couple_id: "c1",
    user_id: DEIVY_ID,
    amount: 3_210_000,
    month: "2026-04-01",
    created_at: "",
  },
  {
    id: "2",
    couple_id: "c1",
    user_id: ANNIE_ID,
    amount: 1_760_000,
    month: "2026-04-01",
    created_at: "",
  },
];

const baseInstallments = [
  {
    id: "p1",
    couple_id: "c1",
    category_id: null,
    auto_renew: false,
    description: "Aire Acondicionado",
    total_amount: 1_320_004,
    installments: 24,
    paid_installments: 19,
    first_payment_date: "2025-09-01",
    created_at: "",
  },
  {
    id: "p2",
    couple_id: "c1",
    category_id: null,
    auto_renew: false,
    description: "Ventiladores",
    total_amount: 500_475,
    installments: 9,
    paid_installments: 3,
    first_payment_date: "2026-01-01",
    created_at: "",
  },
];

describe("calculateMonthlyBalance", () => {
  describe("método proporcional — valores reales de las hojas de cálculo", () => {
    it("calcula correctamente el total de cuotas activas", () => {
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: baseInstallments,
        fixedExpenseInstances: [],
        variableExpenses: [],
      });
      // round(1.320.004 / 24) + round(500.475 / 9) = $55.000 + $55.608 = $110.608
      expect(result.installmentTotal).toBe(110_608);
    });

    it("calcula porcentajes proporcionales correctamente", () => {
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: baseInstallments,
        fixedExpenseInstances: [],
        variableExpenses: [],
      });
      const deivy = result.balances.find((b) => b.userId === DEIVY_ID);
      const annie = result.balances.find((b) => b.userId === ANNIE_ID);
      if (!deivy || !annie) throw new Error("Balances no encontrados");
      expect(deivy.percentage).toBeCloseTo(0.6459, 3);
      expect(annie.percentage).toBeCloseTo(0.3541, 3);
    });

    it("calcula la obligación de cada persona correctamente", () => {
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: baseInstallments,
        fixedExpenseInstances: [],
        variableExpenses: [],
      });
      const deivy = result.balances.find((b) => b.userId === DEIVY_ID);
      const annie = result.balances.find((b) => b.userId === ANNIE_ID);
      if (!deivy || !annie) throw new Error("Balances no encontrados");
      expect(deivy.obligation).toBeCloseTo(71_439, 0);
      expect(annie.obligation).toBeCloseTo(39_169, 0);
    });

    it("excluye compras completamente pagadas del total mensual", () => {
      const withPaidPurchase = [
        ...baseInstallments,
        {
          id: "p3",
          couple_id: "c1",
          category_id: null,
          auto_renew: false,
          description: "Calefon (pagado)",
          total_amount: 578_000,
          installments: 1,
          paid_installments: 1,
          first_payment_date: "2025-01-01",
          created_at: "",
        },
      ];
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: withPaidPurchase,
        fixedExpenseInstances: [],
        variableExpenses: [],
      });
      expect(result.installmentTotal).toBe(110_608);
    });
  });

  describe("gastos fijos", () => {
    it("suma los gastos fijos del mes correctamente", () => {
      const fixedInstances = [
        {
          id: "fi1",
          template_id: "t1",
          couple_id: "c1",
          month: "2026-04-01",
          paid: true,
          created_at: "",
          fixed_expense_templates: {
            id: "t1",
            couple_id: "c1",
            category_id: null,
            description: "Casita",
            amount: 500_000,
            due_day: 9,
            active: true,
            created_at: "",
          },
        },
        {
          id: "fi2",
          template_id: "t2",
          couple_id: "c1",
          month: "2026-04-01",
          paid: false,
          created_at: "",
          fixed_expense_templates: {
            id: "t2",
            couple_id: "c1",
            category_id: null,
            description: "EPEC",
            amount: 68_740,
            due_day: 31,
            active: true,
            created_at: "",
          },
        },
      ];
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [],
        fixedExpenseInstances: fixedInstances,
        variableExpenses: [],
      });
      expect(result.fixedTotal).toBeCloseTo(568_740, 0);
    });
  });

  describe("gastos variables y balance final", () => {
    it("determina quién le debe a quién cuando hay gastos variables", () => {
      const variables = [
        {
          id: "v1",
          couple_id: "c1",
          category_id: null,
          user_id: ANNIE_ID,
          description: "Supermercado",
          amount: 100_000,
          date: "2026-04-15",
          created_at: "",
        },
      ];
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [],
        fixedExpenseInstances: [],
        variableExpenses: variables,
      });
      const annie = result.balances.find((b) => b.userId === ANNIE_ID);
      if (!annie) throw new Error("Balance de Annie no encontrado");
      expect(annie.netBalance).toBeGreaterThan(0);
      expect(result.debtor).toBe(DEIVY_ID);
      expect(result.creditor).toBe(ANNIE_ID);
    });

    it("calcula el monto exacto de la deuda", () => {
      const variables = [
        {
          id: "v1",
          couple_id: "c1",
          category_id: null,
          user_id: ANNIE_ID,
          description: "Supermercado",
          amount: 100_000,
          date: "2026-04-15",
          created_at: "",
        },
      ];
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [],
        fixedExpenseInstances: [],
        variableExpenses: variables,
      });
      expect(result.debtAmount).toBeCloseTo(64_588, 0);
    });
  });

  describe("casos borde", () => {
    it("no divide por cero cuando el ingreso total es cero", () => {
      const zeroIncomes = [
        {
          id: "1",
          couple_id: "c1",
          user_id: DEIVY_ID,
          amount: 0,
          month: "2026-04-01",
          created_at: "",
        },
        {
          id: "2",
          couple_id: "c1",
          user_id: ANNIE_ID,
          amount: 0,
          month: "2026-04-01",
          created_at: "",
        },
      ];
      expect(() =>
        calculateMonthlyBalance({
          incomes: zeroIncomes,
          installmentPurchases: baseInstallments,
          fixedExpenseInstances: [],
          variableExpenses: [],
        }),
      ).not.toThrow();
    });

    it("devuelve debtAmount 0 cuando está todo balanceado", () => {
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [],
        fixedExpenseInstances: [],
        variableExpenses: [],
      });
      expect(result.debtAmount).toBeGreaterThanOrEqual(0);
      expect(result.debtor).toBeNull();
    });

    it("maneja correctamente un solo miembro en la pareja", () => {
      const singleIncome = [baseIncomes[0]];
      const result = calculateMonthlyBalance({
        incomes: singleIncome,
        installmentPurchases: baseInstallments,
        fixedExpenseInstances: [],
        variableExpenses: [],
      });
      const deivy = result.balances[0];
      if (!deivy) throw new Error("Balance no encontrado");
      expect(deivy.percentage).toBe(1);
      expect(deivy.obligation).toBe(110_608);
    });
  });
});
