import { describe, it, expect } from "vitest";
import {
  computeMonthlyInstallment,
  isCardComputedInstallment,
  isInstallmentActiveInMonth,
  isValidInstallmentsEdit,
  isValidOverrideInstallmentNumber,
  installmentNumberForMonth,
  monthsBetween,
  startOfMonth,
} from "../installments";
import type { Database } from "@/types/database";

type InstallmentPurchaseRow =
  Database["public"]["Tables"]["installment_purchases"]["Row"];
type CardRow = Database["public"]["Tables"]["cards"]["Row"];
type InstallmentMonthOverrideRow =
  Database["public"]["Tables"]["installment_month_overrides"]["Row"];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function makePurchase(
  overrides: Partial<InstallmentPurchaseRow> = {},
): InstallmentPurchaseRow {
  return {
    id: "p1",
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

function makeCard(overrides: Partial<CardRow> = {}): CardRow {
  return {
    id: "card1",
    couple_id: "c1",
    name: "Visa Santander",
    payment_day: 10,
    closing_day: null,
    created_at: "",
    ...overrides,
  };
}

function makeOverride(
  overrides: Partial<InstallmentMonthOverrideRow> = {},
): InstallmentMonthOverrideRow {
  return {
    id: "ovr1",
    purchase_id: "p1",
    couple_id: "c1",
    month: "2026-07-01",
    installment_number: 3,
    created_at: "",
    ...overrides,
  };
}

describe("startOfMonth", () => {
  it("normaliza cualquier día del mes al día 1", () => {
    expect(startOfMonth("2026-06-10")).toBe("2026-06-01");
  });
});

describe("monthsBetween", () => {
  it("retorna 0 para el mismo mes", () => {
    expect(monthsBetween("2026-06-01", "2026-06-01")).toBe(0);
  });

  it("retorna un valor positivo cuando 'to' es posterior a 'from'", () => {
    expect(monthsBetween("2026-06-01", "2026-09-01")).toBe(3);
  });

  it("retorna un valor negativo cuando 'to' es anterior a 'from'", () => {
    expect(monthsBetween("2026-06-01", "2026-01-01")).toBe(-5);
  });

  it("cruza el límite de año correctamente", () => {
    expect(monthsBetween("2025-11-01", "2026-02-01")).toBe(3);
  });
});

describe("isInstallmentActiveInMonth", () => {
  it("está ausente antes del mes de inicio (first_payment_date)", () => {
    const purchase = makePurchase({
      first_payment_date: "2026-06-10",
      installments: 12,
      auto_renew: false,
    });
    expect(isInstallmentActiveInMonth(purchase, "2026-05-01")).toBe(false);
  });

  it("está activa dentro de la ventana [inicio, inicio+installments)", () => {
    const purchase = makePurchase({
      first_payment_date: "2026-06-10",
      installments: 12,
      auto_renew: false,
    });
    expect(isInstallmentActiveInMonth(purchase, "2026-06-01")).toBe(true);
    expect(isInstallmentActiveInMonth(purchase, "2026-09-01")).toBe(true);
    expect(isInstallmentActiveInMonth(purchase, "2027-05-01")).toBe(true); // idx=11, último mes
  });

  it("está inactiva una vez terminado el plazo (sin auto_renew)", () => {
    const purchase = makePurchase({
      first_payment_date: "2026-06-10",
      installments: 12,
      auto_renew: false,
    });
    expect(isInstallmentActiveInMonth(purchase, "2027-06-01")).toBe(false); // idx=12, fuera de rango
  });

  it("auto_renew permanece activa indefinidamente hacia el futuro", () => {
    const purchase = makePurchase({
      first_payment_date: "2026-06-10",
      installments: 12,
      auto_renew: true,
    });
    expect(isInstallmentActiveInMonth(purchase, "2030-01-01")).toBe(true);
  });

  it("R3-B: el gating depende del mes SELECCIONADO, no de 'today' — una compra futura queda excluida de un mes pasado sin importar la fecha real", () => {
    // La firma de isInstallmentActiveInMonth no recibe 'today': una compra
    // que empieza en junio 2026 nunca puede aparecer en febrero 2026, sin
    // importar si 'today' real fuera 2030.
    const futurePurchase = makePurchase({
      first_payment_date: "2026-06-01",
      installments: 6,
      auto_renew: false,
    });
    expect(isInstallmentActiveInMonth(futurePurchase, "2026-02-01")).toBe(
      false,
    );
  });
});

describe("isCardComputedInstallment", () => {
  it("true cuando la compra tiene card_id, hay card y la card tiene payment_day", () => {
    const purchase = makePurchase({ card_id: "card1" });
    const card = makeCard({ payment_day: 10 });
    expect(isCardComputedInstallment(purchase, card)).toBe(true);
  });

  it("false sin card_id en la compra (aunque haya card)", () => {
    const purchase = makePurchase({ card_id: null });
    const card = makeCard({ payment_day: 10 });
    expect(isCardComputedInstallment(purchase, card)).toBe(false);
  });

  it("false cuando card es null (card_id apunta a una tarjeta no cargada aún)", () => {
    const purchase = makePurchase({ card_id: "card1" });
    expect(isCardComputedInstallment(purchase, null)).toBe(false);
  });

  it("false cuando la card no tiene payment_day configurado — cae al contador manual", () => {
    const purchase = makePurchase({ card_id: "card1" });
    const card = makeCard({ payment_day: null });
    expect(isCardComputedInstallment(purchase, card)).toBe(false);
  });
});

describe("installmentNumberForMonth", () => {
  const TODAY = new Date(2026, 6, 15); // 15 de julio de 2026

  it("un override para ese mes gana sobre cualquier cómputo", () => {
    const purchase = makePurchase({ card_id: "card1", paid_installments: 0 });
    const card = makeCard({ payment_day: 10 });
    const override = makeOverride({
      month: "2026-07-01",
      installment_number: 3,
    });
    expect(
      installmentNumberForMonth(purchase, card, "2026-07-01", override, TODAY),
    ).toBe(3);
  });

  it("sin card_id o sin card cae de vuelta a paid_installments", () => {
    const purchase = makePurchase({ card_id: null, paid_installments: 5 });
    expect(
      installmentNumberForMonth(purchase, null, "2026-07-01", null, TODAY),
    ).toBe(5);
  });

  it("con card pero sin payment_day cae de vuelta a paid_installments", () => {
    const purchase = makePurchase({ card_id: "card1", paid_installments: 5 });
    const card = makeCard({ payment_day: null });
    expect(
      installmentNumberForMonth(purchase, card, "2026-07-01", null, TODAY),
    ).toBe(5);
  });

  it("mes actual, ANTES del payment_day: decrementa en 1 respecto al índice", () => {
    // first_payment_date=2026-06-10, mes visto=2026-07-01 → idx=1 → n=2
    // today=15/jul, payment_day=20 → today.getDate() < payment_day → n=1
    const purchase = makePurchase({
      card_id: "card1",
      first_payment_date: "2026-06-10",
      installments: 12,
    });
    const card = makeCard({ payment_day: 20 });
    expect(
      installmentNumberForMonth(purchase, card, "2026-07-01", null, TODAY),
    ).toBe(1);
  });

  it("mes actual, DESPUÉS del payment_day: no decrementa", () => {
    // today=15/jul, payment_day=10 → today.getDate() >= payment_day → n=2
    const purchase = makePurchase({
      card_id: "card1",
      first_payment_date: "2026-06-10",
      installments: 12,
    });
    const card = makeCard({ payment_day: 10 });
    expect(
      installmentNumberForMonth(purchase, card, "2026-07-01", null, TODAY),
    ).toBe(2);
  });

  it("mes que NO es el actual: el decremento por payment_day nunca aplica", () => {
    // mes visto=2026-08-01 (no es el mes de TODAY) → idx=2 → n=3, sin decremento
    const purchase = makePurchase({
      card_id: "card1",
      first_payment_date: "2026-06-10",
      installments: 12,
    });
    const card = makeCard({ payment_day: 31 }); // today.getDate() siempre < 31
    expect(
      installmentNumberForMonth(purchase, card, "2026-08-01", null, TODAY),
    ).toBe(3);
  });

  it("el decremento nunca baja de 1 (floor)", () => {
    // idx=0 en el primer mes → n=1, decremento lo dejaría en 0 → clamp a 1
    const purchase = makePurchase({
      card_id: "card1",
      first_payment_date: "2026-07-10",
      installments: 12,
    });
    const card = makeCard({ payment_day: 20 });
    expect(
      installmentNumberForMonth(purchase, card, "2026-07-01", null, TODAY),
    ).toBe(1);
  });

  it("auto_renew envuelve el número con módulo (idx % installments + 1)", () => {
    // installments=12, first_payment_date=2026-01-10, mes visto=2027-01-01
    // → idx=12 → 12 % 12 + 1 = 1 (vuelve a arrancar)
    const purchase = makePurchase({
      card_id: "card1",
      first_payment_date: "2026-01-10",
      installments: 12,
      auto_renew: true,
    });
    const card = makeCard({ payment_day: 5 }); // no es el mes actual, sin decremento
    expect(
      installmentNumberForMonth(purchase, card, "2027-01-01", null, TODAY),
    ).toBe(1);
  });
});

describe("isValidInstallmentsEdit", () => {
  it("R3-C: rechaza un número de cuotas menor a las ya pagadas", () => {
    expect(isValidInstallmentsEdit(5, 6)).toBe(false);
  });

  it("R3-C: acepta un número de cuotas igual a las ya pagadas", () => {
    expect(isValidInstallmentsEdit(6, 6)).toBe(true);
  });

  it("R3-C: acepta un número de cuotas mayor a las ya pagadas", () => {
    expect(isValidInstallmentsEdit(12, 6)).toBe(true);
  });

  it("R3-C: exige al menos 1 cuota aunque paid_installments sea 0", () => {
    expect(isValidInstallmentsEdit(0, 0)).toBe(false);
    expect(isValidInstallmentsEdit(1, 0)).toBe(true);
  });
});

describe("computeMonthlyInstallment", () => {
  it("divide y redondea al entero más cercano", () => {
    // 220102 / 12 = 18341.83... → 18342
    expect(computeMonthlyInstallment(220_102, 12)).toBe(18_342);
  });

  it("retorna 0 cuando total_amount es 0", () => {
    expect(computeMonthlyInstallment(0, 12)).toBe(0);
  });

  it("retorna el mismo total cuando hay 1 cuota", () => {
    expect(computeMonthlyInstallment(100_000, 1)).toBe(100_000);
  });

  it("redondea hacia abajo cuando el resultado tiene fracción < 0.5", () => {
    // 100 / 3 = 33.33... → 33 (Math.round rounds down)
    expect(computeMonthlyInstallment(100, 3)).toBe(33);
  });

  it("retorna 0 cuando installments es 0 (guardia contra división por cero)", () => {
    expect(computeMonthlyInstallment(100_000, 0)).toBe(0);
  });

  it("retorna 0 cuando installments es negativo", () => {
    expect(computeMonthlyInstallment(100_000, -5)).toBe(0);
  });

  it("redondea correctamente con fracción >= 0.5", () => {
    // 10 / 3 = 3.33... → 3 (but 7/2 = 3.5 → 4)
    expect(computeMonthlyInstallment(7, 2)).toBe(4);
  });
});

// ── JD-003: OVERRIDE INSTALLMENT NUMBER RANGE ──────────────────────────────────

describe("isValidOverrideInstallmentNumber", () => {
  it("acepta un entero dentro de [1, installments]", () => {
    expect(isValidOverrideInstallmentNumber(1, 12)).toBe(true);
    expect(isValidOverrideInstallmentNumber(6, 12)).toBe(true);
    expect(isValidOverrideInstallmentNumber(12, 12)).toBe(true);
  });

  it("rechaza un número menor a 1", () => {
    expect(isValidOverrideInstallmentNumber(0, 12)).toBe(false);
    expect(isValidOverrideInstallmentNumber(-3, 12)).toBe(false);
  });

  it("rechaza un número mayor a la cantidad de cuotas (cota superior)", () => {
    expect(isValidOverrideInstallmentNumber(13, 12)).toBe(false);
    expect(isValidOverrideInstallmentNumber(7, 6)).toBe(false);
  });

  it("rechaza valores no enteros", () => {
    expect(isValidOverrideInstallmentNumber(2.5, 12)).toBe(false);
    expect(isValidOverrideInstallmentNumber(Number.NaN, 12)).toBe(false);
  });
});
