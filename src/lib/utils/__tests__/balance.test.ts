import { describe, it, expect } from "vitest";
import { calculateMonthlyBalance, effectiveFixedAmount } from "../balance";

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
    credit_card: null,
    auto_renew: false,
    description: "Aire Acondicionado",
    total_amount: 1_320_004,
    installments: 24,
    paid_installments: 19,
    first_payment_date: "2025-09-01",
    created_at: "",
    paid_by_user_id: null as string | null,
  },
  {
    id: "p2",
    couple_id: "c1",
    category_id: null,
    credit_card: null,
    auto_renew: false,
    description: "Ventiladores",
    total_amount: 500_475,
    installments: 9,
    paid_installments: 3,
    first_payment_date: "2026-01-01",
    created_at: "",
    paid_by_user_id: null as string | null,
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
          credit_card: null,
          auto_renew: false,
          description: "Calefon (pagado)",
          total_amount: 578_000,
          installments: 1,
          paid_installments: 1,
          first_payment_date: "2025-01-01",
          created_at: "",
          paid_by_user_id: null as string | null,
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
          status: "CONFIRMED" as string,
          amount_override: null as number | null,
          due_day: null as number | null,
          paid_by_user_id: null as string | null,
          fixed_expense_templates: {
            id: "t1",
            couple_id: "c1",
            category_id: null,
            description: "Casita",
            amount: 500_000,
            due_day: 9,
            active: true,
            requires_monthly_review: false,
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
          status: "CONFIRMED" as string,
          amount_override: null as number | null,
          due_day: null as number | null,
          paid_by_user_id: null as string | null,
          fixed_expense_templates: {
            id: "t2",
            couple_id: "c1",
            category_id: null,
            description: "EPEC",
            amount: 68_740,
            due_day: 31,
            active: true,
            requires_monthly_review: false,
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
          is_shared: true,
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
          is_shared: true,
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

    it("calcula capacidad de ahorro como ingreso total menos gastos totales", () => {
      const variables = [
        {
          id: "v1",
          couple_id: "c1",
          category_id: null,
          user_id: ANNIE_ID,
          description: "Supermercado",
          amount: 100_000,
          is_shared: true,
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

      expect(result.savingsCapacity).toBe(4_870_000);
    });

    it("excluye gastos individuales del cálculo de deuda entre pareja", () => {
      const variables = [
        {
          id: "v1",
          couple_id: "c1",
          category_id: null,
          user_id: ANNIE_ID,
          description: "Personal Annie",
          amount: 100_000,
          is_shared: false,
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

      expect(result.variableIndividualTotal).toBe(100_000);
      expect(result.variableSharedTotal).toBe(0);
      expect(result.debtAmount).toBe(0);
      expect(result.debtor).toBeNull();
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

    it("permite capacidad de ahorro negativa cuando los gastos superan ingresos", () => {
      const result = calculateMonthlyBalance({
        incomes: [
          {
            id: "1",
            couple_id: "c1",
            user_id: DEIVY_ID,
            amount: 100_000,
            month: "2026-04-01",
            created_at: "",
          },
        ],
        installmentPurchases: [
          {
            id: "p1",
            couple_id: "c1",
            category_id: null,
            credit_card: null,
            auto_renew: false,
            description: "Compra",
            total_amount: 500_000,
            installments: 1,
            paid_installments: 0,
            first_payment_date: "2026-04-01",
            created_at: "",
            paid_by_user_id: null as string | null,
          },
        ],
        fixedExpenseInstances: [],
        variableExpenses: [],
      });

      expect(result.savingsCapacity).toBe(-400_000);
    });
  });

  describe("gastos fijos con override de monto", () => {
    const baseTemplate = {
      id: "t1",
      couple_id: "c1",
      category_id: null,
      description: "Luz",
      amount: 100_000,
      due_day: 15,
      active: true,
      requires_monthly_review: false,
      created_at: "",
    };
    const baseInstance = {
      id: "fi1",
      template_id: "t1",
      couple_id: "c1",
      month: "2026-04-01",
      paid: false,
      created_at: "",
      status: "CONFIRMED" as string,
      amount_override: null as number | null,
      due_day: null as number | null,
      paid_by_user_id: null as string | null,
      fixed_expense_templates: baseTemplate,
    };

    it("lista mixta suma override y template correctamente", () => {
      const fixedInstances = [
        { ...baseInstance, id: "fi1", amount_override: 50_000 },
        {
          ...baseInstance,
          id: "fi2",
          amount_override: null,
          fixed_expense_templates: {
            ...baseTemplate,
            id: "t2",
            amount: 100_000,
          },
        },
        { ...baseInstance, id: "fi3", amount_override: 200_000 },
      ];
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [],
        fixedExpenseInstances: fixedInstances,
        variableExpenses: [],
      });
      expect(result.fixedTotal).toBe(350_000);
    });

    it("todos con amount_override null usa template amounts (regresión)", () => {
      const fixedInstances = [
        { ...baseInstance, id: "fi1", amount_override: null },
        {
          ...baseInstance,
          id: "fi2",
          amount_override: null,
          fixed_expense_templates: {
            ...baseTemplate,
            id: "t2",
            amount: 68_740,
          },
        },
      ];
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [],
        fixedExpenseInstances: fixedInstances,
        variableExpenses: [],
      });
      expect(result.fixedTotal).toBe(168_740);
    });

    it("instancia con override null después de tener valor usa template (no closure leak)", () => {
      const withOverride = { ...baseInstance, amount_override: 800 };
      const withNull = { ...baseInstance, amount_override: null };
      const resultWithOverride = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [],
        fixedExpenseInstances: [withOverride],
        variableExpenses: [],
      });
      const resultWithNull = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [],
        fixedExpenseInstances: [withNull],
        variableExpenses: [],
      });
      expect(resultWithOverride.fixedTotal).toBe(800);
      expect(resultWithNull.fixedTotal).toBe(100_000);
    });
  });

  describe("cuotas con renovación automática (auto_renew)", () => {
    const autoRenewPurchase = {
      id: "ar1",
      couple_id: "c1",
      category_id: null,
      credit_card: null,
      auto_renew: true,
      description: "Suscripción mensual",
      total_amount: 120_000,
      installments: 12,
      paid_installments: 12, // completamente pagada, pero se renueva
      first_payment_date: "2025-01-01",
      created_at: "",
      paid_by_user_id: null as string | null,
    };

    it("incluye cuotas auto_renew aunque estén completamente pagadas", () => {
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [autoRenewPurchase],
        fixedExpenseInstances: [],
        variableExpenses: [],
      });
      // 120.000 / 12 = 10.000 por mes — debe incluirse aunque paid_installments === installments
      expect(result.installmentTotal).toBe(10_000);
    });

    it("excluye cuotas sin auto_renew cuando están completamente pagadas", () => {
      const paidPurchase = {
        ...autoRenewPurchase,
        id: "ar2",
        auto_renew: false,
      };
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [paidPurchase],
        fixedExpenseInstances: [],
        variableExpenses: [],
      });
      expect(result.installmentTotal).toBe(0);
    });

    it("las cuotas auto_renew reducen la capacidad de ahorro mensualmente", () => {
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [autoRenewPurchase],
        fixedExpenseInstances: [],
        variableExpenses: [],
      });
      // totalIncome = 4.970.000, installmentTotal = 10.000
      expect(result.savingsCapacity).toBe(4_960_000);
    });

    it("combina cuotas auto_renew con cuotas normales activas", () => {
      const activePurchase = {
        id: "ar3",
        couple_id: "c1",
        category_id: null,
        credit_card: null,
        auto_renew: false,
        description: "Notebook",
        total_amount: 600_000,
        installments: 6,
        paid_installments: 3, // 3 restantes
        first_payment_date: "2026-01-01",
        created_at: "",
        paid_by_user_id: null as string | null,
      };
      const result = calculateMonthlyBalance({
        incomes: baseIncomes,
        installmentPurchases: [autoRenewPurchase, activePurchase],
        fixedExpenseInstances: [],
        variableExpenses: [],
      });
      // auto_renew: 120.000 / 12 = 10.000; normal: 600.000 / 6 = 100.000; total = 110.000
      expect(result.installmentTotal).toBe(110_000);
    });
  });
});

// ── PAYER ATTRIBUTION TESTS ───────────────────────────────────────────────────

describe("calculateMonthlyBalance — payer attribution (payer-attribution)", () => {
  const template = {
    id: "t-attr",
    couple_id: "c1",
    category_id: null,
    description: "Luz attr",
    amount: 60_000,
    due_day: 15,
    active: true,
    requires_monthly_review: false,
    created_at: "",
  };

  function makeFixedInstance(
    id: string,
    paid: boolean,
    paid_by_user_id: string | null,
    amount = 60_000,
  ) {
    return {
      id,
      template_id: "t-attr",
      couple_id: "c1",
      month: "2026-04-01",
      paid,
      paid_by_user_id,
      created_at: "",
      status: "CONFIRMED" as string,
      amount_override: null as number | null,
      due_day: null as number | null,
      fixed_expense_templates: { ...template, amount },
    };
  }

  function makeInstallment(
    id: string,
    paid_by_user_id: string | null,
    opts: {
      total_amount?: number;
      installments?: number;
      paid_installments?: number;
      auto_renew?: boolean;
    } = {},
  ) {
    return {
      id,
      couple_id: "c1",
      category_id: null,
      credit_card: null,
      description: `Cuota ${id}`,
      total_amount: opts.total_amount ?? 12_000,
      installments: opts.installments ?? 12,
      paid_installments: opts.paid_installments ?? 0,
      auto_renew: opts.auto_renew ?? false,
      paid_by_user_id,
      first_payment_date: "2026-01-01",
      created_at: "",
    };
  }

  const twoIncomes = [
    {
      id: "i1",
      couple_id: "c1",
      user_id: DEIVY_ID,
      amount: 1_000_000,
      month: "2026-04-01",
      created_at: "",
    },
    {
      id: "i2",
      couple_id: "c1",
      user_id: ANNIE_ID,
      amount: 1_000_000,
      month: "2026-04-01",
      created_at: "",
    },
  ];

  it("SCEN-01: instancia fija pagada y atribuida a Deivy se acredita en su actualPaid", () => {
    const fi = makeFixedInstance("fi1", true, DEIVY_ID, 60_000);
    const result = calculateMonthlyBalance({
      incomes: twoIncomes,
      installmentPurchases: [],
      fixedExpenseInstances: [fi],
      variableExpenses: [],
    });
    expect(result.balances.find((b) => b.userId === DEIVY_ID)!.actualPaid).toBe(
      60_000,
    );
    expect(result.balances.find((b) => b.userId === ANNIE_ID)!.actualPaid).toBe(
      0,
    );
  });

  it("SCEN-02: instancia fija pagada sin atribución no se acredita a nadie", () => {
    const fi = makeFixedInstance("fi2", true, null, 60_000);
    const result = calculateMonthlyBalance({
      incomes: twoIncomes,
      installmentPurchases: [],
      fixedExpenseInstances: [fi],
      variableExpenses: [],
    });
    expect(result.balances.find((b) => b.userId === DEIVY_ID)!.actualPaid).toBe(
      0,
    );
    expect(result.balances.find((b) => b.userId === ANNIE_ID)!.actualPaid).toBe(
      0,
    );
  });

  it("SCEN-03: dos instancias fijas atribuidas a distintas personas se acreditan correctamente", () => {
    const result = calculateMonthlyBalance({
      incomes: twoIncomes,
      installmentPurchases: [],
      fixedExpenseInstances: [
        makeFixedInstance("fi3a", true, DEIVY_ID, 60_000),
        makeFixedInstance("fi3b", true, ANNIE_ID, 40_000),
      ],
      variableExpenses: [],
    });
    expect(result.balances.find((b) => b.userId === DEIVY_ID)!.actualPaid).toBe(
      60_000,
    );
    expect(result.balances.find((b) => b.userId === ANNIE_ID)!.actualPaid).toBe(
      40_000,
    );
  });

  it("SCEN-04: cuota activa atribuida a Deivy — acredita round(total/installments)", () => {
    const p = makeInstallment("p-s4", DEIVY_ID, {
      total_amount: 12_000,
      installments: 12,
      paid_installments: 5,
    });
    const result = calculateMonthlyBalance({
      incomes: twoIncomes,
      installmentPurchases: [p],
      fixedExpenseInstances: [],
      variableExpenses: [],
    });
    expect(result.balances.find((b) => b.userId === DEIVY_ID)!.actualPaid).toBe(
      1_000,
    );
    expect(result.balances.find((b) => b.userId === ANNIE_ID)!.actualPaid).toBe(
      0,
    );
  });

  it("SCEN-05: cuota sin pagador atribuido no acredita a nadie", () => {
    const p = makeInstallment("p-s5", null, {
      total_amount: 12_000,
      installments: 12,
      paid_installments: 5,
    });
    const result = calculateMonthlyBalance({
      incomes: twoIncomes,
      installmentPurchases: [p],
      fixedExpenseInstances: [],
      variableExpenses: [],
    });
    expect(result.balances.find((b) => b.userId === DEIVY_ID)!.actualPaid).toBe(
      0,
    );
    expect(result.balances.find((b) => b.userId === ANNIE_ID)!.actualPaid).toBe(
      0,
    );
  });

  it("SCEN-07: cuota auto_renew completamente pagada pero atribuida sigue acreditando", () => {
    const p = makeInstallment("p-s7", ANNIE_ID, {
      total_amount: 120_000,
      installments: 12,
      paid_installments: 12,
      auto_renew: true,
    });
    const result = calculateMonthlyBalance({
      incomes: twoIncomes,
      installmentPurchases: [p],
      fixedExpenseInstances: [],
      variableExpenses: [],
    });
    expect(result.balances.find((b) => b.userId === ANNIE_ID)!.actualPaid).toBe(
      10_000,
    );
    expect(result.balances.find((b) => b.userId === DEIVY_ID)!.actualPaid).toBe(
      0,
    );
  });

  it("mixto: variable + fijo + cuota para Deivy suman correctamente en actualPaid", () => {
    const variable = {
      id: "v-mix",
      couple_id: "c1",
      category_id: null,
      user_id: DEIVY_ID,
      description: "Super",
      amount: 50_000,
      is_shared: true,
      date: "2026-04-10",
      created_at: "",
    };
    const result = calculateMonthlyBalance({
      incomes: twoIncomes,
      installmentPurchases: [
        makeInstallment("p-mix", DEIVY_ID, {
          total_amount: 12_000,
          installments: 12,
          paid_installments: 3,
        }),
      ],
      fixedExpenseInstances: [
        makeFixedInstance("fi-mix", true, DEIVY_ID, 60_000),
      ],
      variableExpenses: [variable],
    });
    expect(result.balances.find((b) => b.userId === DEIVY_ID)!.actualPaid).toBe(
      111_000,
    );
  });

  it("regresión: baseInstallments con paid_by_user_id null no cambian actualPaid previo", () => {
    const result = calculateMonthlyBalance({
      incomes: baseIncomes,
      installmentPurchases: baseInstallments,
      fixedExpenseInstances: [],
      variableExpenses: [],
    });
    for (const b of result.balances) {
      expect(b.actualPaid).toBe(0);
    }
  });
});

describe("effectiveFixedAmount", () => {
  const baseTemplate = {
    id: "t1",
    couple_id: "c1",
    category_id: null,
    description: "Internet",
    amount: 12_000,
    due_day: 10,
    active: true,
    requires_monthly_review: false,
    created_at: "",
  };
  const baseInstance = {
    id: "fi1",
    template_id: "t1",
    couple_id: "c1",
    month: "2026-04-01",
    paid: false,
    created_at: "",
    status: "CONFIRMED" as string,
    amount_override: null as number | null,
    due_day: null as number | null,
    paid_by_user_id: null as string | null,
    fixed_expense_templates: baseTemplate,
  };

  it("devuelve template.amount cuando amount_override es null (guardia de regresión)", () => {
    const instance = { ...baseInstance, amount_override: null };
    expect(effectiveFixedAmount(instance)).toBe(12_000);
  });

  it("devuelve amount_override cuando está presente (número)", () => {
    const instance = { ...baseInstance, amount_override: 12345.67 };
    expect(effectiveFixedAmount(instance)).toBe(12345.67);
  });

  it("castea correctamente string numérico de Supabase JSON a número", () => {
    // Supabase retorna numeric como string en el JSON wire protocol
    const instance = {
      ...baseInstance,
      amount_override: "9999.99" as unknown as number | null,
    };
    expect(effectiveFixedAmount(instance)).toBe(9999.99);
  });
});

// ── SCEN-01 / SCEN-02: status field does not affect balance math ──────────────

describe("calculateMonthlyBalance — PENDING_CONFIRMATION status (RF-07)", () => {
  const template = {
    id: "t1",
    couple_id: "c1",
    category_id: null,
    description: "Luz",
    amount: 80_000,
    due_day: 15,
    active: true,
    requires_monthly_review: true,
    created_at: "",
  };

  const pendingInstance = {
    id: "fi1",
    template_id: "t1",
    couple_id: "c1",
    month: "2026-04-01",
    paid: false,
    created_at: "",
    status: "PENDING_CONFIRMATION" as string,
    amount_override: null as number | null,
    due_day: null as number | null,
    paid_by_user_id: null as string | null,
    fixed_expense_templates: template,
  };

  const confirmedInstance = {
    ...pendingInstance,
    status: "CONFIRMED" as string,
  };

  const incomes = [
    {
      id: "1",
      couple_id: "c1",
      user_id: "user-a",
      amount: 1_000_000,
      month: "2026-04-01",
      created_at: "",
    },
  ];

  // SCEN-01: PENDING_CONFIRMATION instance is included in fixed total — same as CONFIRMED
  it("SCEN-01: instancia PENDING_CONFIRMATION se incluye en el total de gastos fijos", () => {
    const result = calculateMonthlyBalance({
      incomes,
      installmentPurchases: [],
      fixedExpenseInstances: [pendingInstance],
      variableExpenses: [],
    });
    expect(result.fixedTotal).toBe(80_000);
  });

  // SCEN-02: CONFIRMED instance produces identical result — non-regression
  it("SCEN-02: instancia CONFIRMED produce el mismo total que PENDING_CONFIRMATION", () => {
    const pendingResult = calculateMonthlyBalance({
      incomes,
      installmentPurchases: [],
      fixedExpenseInstances: [pendingInstance],
      variableExpenses: [],
    });
    const confirmedResult = calculateMonthlyBalance({
      incomes,
      installmentPurchases: [],
      fixedExpenseInstances: [confirmedInstance],
      variableExpenses: [],
    });
    expect(pendingResult.fixedTotal).toBe(confirmedResult.fixedTotal);
    expect(pendingResult.totalExpenses).toBe(confirmedResult.totalExpenses);
  });
});
