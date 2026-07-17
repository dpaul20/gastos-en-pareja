import { describe, it, expect } from "vitest";
import { calculateMonthlyBalance } from "../balance";
import {
  summarizeSettlements,
  previewBillImpact,
  assertValidSettlement,
  type Settlement,
} from "../settlement";

const DEIVY_ID = "user-deivy";
const ANNIE_ID = "user-annie";

// ── summarizeSettlements ─────────────────────────────────────────────────

describe("summarizeSettlements", () => {
  it("no settlements, no debtor: remainingDebt is 0, direction is null", () => {
    const result = summarizeSettlements({
      debtor: null,
      creditor: null,
      debtAmount: 0,
      settlements: [],
    });
    expect(result).toEqual({
      direction: null,
      settledTotal: 0,
      remainingDebt: 0,
      entries: [],
    });
  });

  it("no settlements, a debtor exists: remainingDebt equals the full debtAmount", () => {
    const result = summarizeSettlements({
      debtor: ANNIE_ID,
      creditor: DEIVY_ID,
      debtAmount: 59_949,
      settlements: [],
    });
    expect(result.settledTotal).toBe(0);
    expect(result.remainingDebt).toBe(59_949);
    expect(result.direction).toEqual({ debtor: ANNIE_ID, creditor: DEIVY_ID });
  });

  it("a single settlement in the debt direction fully cancels the debt", () => {
    const settlements: Settlement[] = [
      { from_user_id: ANNIE_ID, to_user_id: DEIVY_ID, amount: 59_949 },
    ];
    const result = summarizeSettlements({
      debtor: ANNIE_ID,
      creditor: DEIVY_ID,
      debtAmount: 59_949,
      settlements,
    });
    expect(result.settledTotal).toBe(59_949);
    expect(result.remainingDebt).toBe(0);
  });

  it("multiple settlements SUM, never a net of only the latest — spec 'Two settlements same month'", () => {
    const settlements: Settlement[] = [
      { from_user_id: ANNIE_ID, to_user_id: DEIVY_ID, amount: 59_949 },
      { from_user_id: ANNIE_ID, to_user_id: DEIVY_ID, amount: 80_131 },
    ];
    const result = summarizeSettlements({
      debtor: ANNIE_ID,
      creditor: DEIVY_ID,
      debtAmount: 140_080,
      settlements,
    });
    expect(result.settledTotal).toBe(140_080);
    expect(result.remainingDebt).toBe(0);
    // the ledger lists both entries, not a net
    expect(result.entries).toHaveLength(2);
  });

  it("a reverse-direction settlement SUBTRACTS from settledTotal (signed, not absolute)", () => {
    const settlements: Settlement[] = [
      { from_user_id: ANNIE_ID, to_user_id: DEIVY_ID, amount: 59_949 },
      // Deivy sends some of it back — a correction, not a new independent debt.
      { from_user_id: DEIVY_ID, to_user_id: ANNIE_ID, amount: 10_000 },
    ];
    const result = summarizeSettlements({
      debtor: ANNIE_ID,
      creditor: DEIVY_ID,
      debtAmount: 59_949,
      settlements,
    });
    expect(result.settledTotal).toBe(49_949);
    expect(result.remainingDebt).toBe(10_000);
  });

  it("overpayment: remainingDebt goes NEGATIVE, never clamped to zero", () => {
    const settlements: Settlement[] = [
      { from_user_id: ANNIE_ID, to_user_id: DEIVY_ID, amount: 70_000 },
    ];
    const result = summarizeSettlements({
      debtor: ANNIE_ID,
      creditor: DEIVY_ID,
      debtAmount: 59_949,
      settlements,
    });
    expect(result.remainingDebt).toBe(-10_051);
  });

  it("no debtor (balanced month) + a settlement recorded anyway: direction comes from the FIRST entry, remainingDebt goes negative by that amount", () => {
    const settlements: Settlement[] = [
      { from_user_id: ANNIE_ID, to_user_id: DEIVY_ID, amount: 25_000 },
    ];
    const result = summarizeSettlements({
      debtor: null,
      creditor: null,
      debtAmount: 0,
      settlements,
    });
    expect(result.direction).toEqual({ debtor: ANNIE_ID, creditor: DEIVY_ID });
    expect(result.settledTotal).toBe(25_000);
    expect(result.remainingDebt).toBe(-25_000);
  });

  it("no debtor + multiple settlements: first entry's direction still governs later entries, including reverse ones", () => {
    const settlements: Settlement[] = [
      { from_user_id: ANNIE_ID, to_user_id: DEIVY_ID, amount: 25_000 },
      { from_user_id: DEIVY_ID, to_user_id: ANNIE_ID, amount: 10_000 },
    ];
    const result = summarizeSettlements({
      debtor: null,
      creditor: null,
      debtAmount: 0,
      settlements,
    });
    expect(result.settledTotal).toBe(15_000);
    expect(result.remainingDebt).toBe(-15_000);
  });

  it("defensive: a settlement between unexpected parties is ADDED, never silently dropped (settlement.ts:89-92)", () => {
    const settlements: Settlement[] = [
      { from_user_id: ANNIE_ID, to_user_id: DEIVY_ID, amount: 10_000 },
      // Can't happen in a real two-person couple, but the reducer must never
      // drop money it doesn't recognize — it adds it in the debt direction.
      {
        from_user_id: "user-stranger",
        to_user_id: "user-other",
        amount: 5_000,
      },
    ];
    const result = summarizeSettlements({
      debtor: ANNIE_ID,
      creditor: DEIVY_ID,
      debtAmount: 20_000,
      settlements,
    });
    expect(result.settledTotal).toBe(15_000);
  });
});

// ── Structural invariant: calculateMonthlyBalance never sees settlements ──

const baseIncomes = [
  {
    id: "1",
    couple_id: "c1",
    user_id: DEIVY_ID,
    amount: 3_210_000,
    month: "2026-08-01",
    created_at: "",
  },
  {
    id: "2",
    couple_id: "c1",
    user_id: ANNIE_ID,
    amount: 1_760_000,
    month: "2026-08-01",
    created_at: "",
  },
];

const baseInstallments: Parameters<
  typeof calculateMonthlyBalance
>[0]["installmentPurchases"] = [];

const baseTemplate = {
  id: "t1",
  couple_id: "c1",
  description: "Expensas",
  amount: 26_292,
  due_day: 10,
  category_id: null,
  requires_monthly_review: false,
  awaits_bill: false,
  is_shared: true,
  owner_user_id: null,
  active: true,
  created_at: "",
};

const baseFixedInstances: Parameters<
  typeof calculateMonthlyBalance
>[0]["fixedExpenseInstances"] = [
  {
    id: "fi1",
    template_id: "t1",
    couple_id: "c1",
    month: "2026-08-01",
    paid: true,
    paid_by_user_id: DEIVY_ID,
    amount_override: null,
    status: "CONFIRMED",
    due_day: null,
    billed_at: null,
    created_at: "",
    fixed_expense_templates: baseTemplate,
  },
];

const baseVariables: Parameters<
  typeof calculateMonthlyBalance
>[0]["variableExpenses"] = [];

describe("settlement invariant — calculateMonthlyBalance never sees settlements", () => {
  it("actualPaid/obligation/netBalance are byte-identical whether or not settlements exist (D3, structural)", () => {
    const params = {
      incomes: baseIncomes,
      installmentPurchases: baseInstallments,
      fixedExpenseInstances: baseFixedInstances,
      variableExpenses: baseVariables,
    };

    const before = calculateMonthlyBalance(params);

    // Settlements exist "elsewhere" in the system — recorded via
    // summarizeSettlements — but calculateMonthlyBalance's own parameter
    // type has no `settlements` field to receive them even if this test
    // tried to pass them through.
    const settlements: Settlement[] = [
      { from_user_id: ANNIE_ID, to_user_id: DEIVY_ID, amount: 10_000 },
    ];
    summarizeSettlements({
      debtor: before.debtor,
      creditor: before.creditor,
      debtAmount: before.debtAmount,
      settlements,
    });

    const after = calculateMonthlyBalance(params);

    expect(after.balances).toEqual(before.balances);
    expect(after.debtor).toBe(before.debtor);
    expect(after.creditor).toBe(before.creditor);
    expect(after.debtAmount).toBe(before.debtAmount);

    // Compile-time guard: calculateMonthlyBalance's parameter type has no
    // `settlements` key. This line fails to typecheck (and `tsc --noEmit`
    // catches it) if that ever changes.
    type Params = Parameters<typeof calculateMonthlyBalance>[0];
    type HasSettlements = "settlements" extends keyof Params ? true : false;
    const structuralGuard: HasSettlements = false;
    expect(structuralGuard).toBe(false);
  });
});

// ── previewBillImpact ───────────────────────────────────────────────────

describe("previewBillImpact", () => {
  const params = {
    incomes: baseIncomes,
    installmentPurchases: baseInstallments,
    variableExpenses: baseVariables,
  };

  it("returns null when the month is not already settled (currentRemainingDebt > 0)", () => {
    const awaitingInstance = {
      ...baseFixedInstances[0],
      id: "fi-awaiting",
      paid: false,
      paid_by_user_id: null,
      amount_override: null,
      status: "AWAITING_BILL",
    };
    const result = previewBillImpact({
      ...params,
      fixedExpenseInstances: [...baseFixedInstances, awaitingInstance],
      settlements: [],
      instanceId: "fi-awaiting",
      amount: 30_000,
    });
    expect(result).toBeNull();
  });

  it("returns null via the SECOND guard: month already settled AND the bill keeps it at zero (settlement.ts:176)", () => {
    // This reaches the "does not reopen" guard, NOT the earlier
    // `currentRemainingDebt > 0` short-circuit. A month with no billed
    // expenses is balanced (no debtor, remainingDebt 0), so it PASSES the
    // first guard. The only instance is AWAITING_BILL (excluded from the
    // current math); billing it at $0 adds no obligation, so
    // projectedRemainingDebt stays exactly 0 and line 176 is the return.
    const awaitingInstance = {
      ...baseFixedInstances[0],
      id: "fi-awaiting",
      paid: false,
      paid_by_user_id: null,
      amount_override: null,
      status: "AWAITING_BILL",
    };
    const result = previewBillImpact({
      ...params,
      fixedExpenseInstances: [awaitingInstance],
      settlements: [],
      instanceId: "fi-awaiting",
      amount: 0,
    });
    expect(result).toBeNull();
  });

  it("warns with the exact difference when loading a bill reopens a saldado month", () => {
    // Deivy 100k, Annie 50k income; a 30k shared variable expense paid by
    // Deivy creates a 10k debt Annie owes Deivy — settled by one settlement.
    const incomes = [
      {
        id: "1",
        couple_id: "c1",
        user_id: DEIVY_ID,
        amount: 100_000,
        month: "2026-08-01",
        created_at: "",
      },
      {
        id: "2",
        couple_id: "c1",
        user_id: ANNIE_ID,
        amount: 50_000,
        month: "2026-08-01",
        created_at: "",
      },
    ];
    const variables: Parameters<
      typeof calculateMonthlyBalance
    >[0]["variableExpenses"] = [
      {
        id: "v1",
        couple_id: "c1",
        user_id: DEIVY_ID,
        description: "Super",
        amount: 30_000,
        date: "2026-08-05",
        category_id: null,
        is_shared: true,
        created_at: "",
      },
    ];
    const awaitingInstance = {
      ...baseFixedInstances[0],
      id: "fi-awaiting",
      paid: false,
      paid_by_user_id: null,
      amount_override: null,
      status: "AWAITING_BILL",
    };
    const settlements: Settlement[] = [
      { from_user_id: ANNIE_ID, to_user_id: DEIVY_ID, amount: 10_000 },
    ];

    const result = previewBillImpact({
      incomes,
      installmentPurchases: baseInstallments,
      fixedExpenseInstances: [awaitingInstance],
      variableExpenses: variables,
      settlements,
      instanceId: "fi-awaiting",
      amount: 6_000,
    });

    expect(result).not.toBeNull();
    expect(result?.currentRemainingDebt).toBe(0);
    expect(result?.projectedRemainingDebt).toBe(2_000);
    expect(result?.difference).toBe(2_000);
  });
});

// ── assertValidSettlement ────────────────────────────────────────────────

describe("assertValidSettlement", () => {
  it("accepts a positive amount between two distinct parties", () => {
    expect(() =>
      assertValidSettlement({
        amount: 10_000,
        from_user_id: ANNIE_ID,
        to_user_id: DEIVY_ID,
      }),
    ).not.toThrow();
  });

  it("rejects a zero amount", () => {
    expect(() =>
      assertValidSettlement({
        amount: 0,
        from_user_id: ANNIE_ID,
        to_user_id: DEIVY_ID,
      }),
    ).toThrow("El monto debe ser mayor a cero");
  });

  it("rejects a negative amount", () => {
    expect(() =>
      assertValidSettlement({
        amount: -1,
        from_user_id: ANNIE_ID,
        to_user_id: DEIVY_ID,
      }),
    ).toThrow("El monto debe ser mayor a cero");
  });

  it("rejects a non-finite amount (NaN/Infinity from a bad payload)", () => {
    expect(() =>
      assertValidSettlement({
        amount: Number.NaN,
        from_user_id: ANNIE_ID,
        to_user_id: DEIVY_ID,
      }),
    ).toThrow("El monto debe ser mayor a cero");
  });

  it("rejects a settlement to oneself (from === to)", () => {
    expect(() =>
      assertValidSettlement({
        amount: 10_000,
        from_user_id: ANNIE_ID,
        to_user_id: ANNIE_ID,
      }),
    ).toThrow("No podés registrar un pago a vos mismo");
  });
});
