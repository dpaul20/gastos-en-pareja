import { describe, it, expect } from "vitest";
import { parseAmount } from "../amount";

describe("parseAmount", () => {
  describe("formato argentino — puntos como miles", () => {
    it("1.500.000 → 1500000", () => expect(parseAmount("1.500.000")).toBe(1_500_000));
    it("3.210.000 → 3210000", () => expect(parseAmount("3.210.000")).toBe(3_210_000));
    it("1.500 → 1500 (3 dígitos después del punto = miles)", () => expect(parseAmount("1.500")).toBe(1_500));
  });

  describe("punto decimal", () => {
    it("1.5 → 1.5", () => expect(parseAmount("1.5")).toBe(1.5));
    it("1.50 → 1.5 (2 dígitos después del punto = decimal)", () => expect(parseAmount("1.50")).toBe(1.5));
    it("0.99 → 0.99", () => expect(parseAmount("0.99")).toBe(0.99));
  });

  describe("coma como decimal (formato europeo sin miles)", () => {
    it("1500,50 → 1500.5", () => expect(parseAmount("1500,50")).toBe(1_500.5));
    it("99,9 → 99.9", () => expect(parseAmount("99,9")).toBe(99.9));
  });

  describe("formato europeo completo (punto=miles, coma=decimal)", () => {
    it("1.500,50 → 1500.5", () => expect(parseAmount("1.500,50")).toBe(1_500.5));
    it("1.500.000,50 → 1500000.5", () => expect(parseAmount("1.500.000,50")).toBe(1_500_000.5));
  });

  describe("prefijo $ y espacios", () => {
    it("$1500 → 1500", () => expect(parseAmount("$1500")).toBe(1_500));
    it("$ 1.500.000 → 1500000", () => expect(parseAmount("$ 1.500.000")).toBe(1_500_000));
    it("  1500  → 1500", () => expect(parseAmount("  1500  ")).toBe(1_500));
  });

  describe("enteros sin separadores", () => {
    it("1500 → 1500", () => expect(parseAmount("1500")).toBe(1_500));
    it("0 → 0", () => expect(parseAmount("0")).toBe(0));
  });

  describe("valores inválidos → NaN", () => {
    it("cadena vacía → NaN", () => expect(parseAmount("")).toBeNaN());
    it("solo $ → NaN", () => expect(parseAmount("$")).toBeNaN());
    it("3a → NaN", () => expect(parseAmount("3a")).toBeNaN());
    it("abc → NaN", () => expect(parseAmount("abc")).toBeNaN());
  });
});
