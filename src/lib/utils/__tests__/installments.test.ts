import { describe, it, expect } from "vitest";
import { computeMonthlyInstallment } from "../installments";

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
