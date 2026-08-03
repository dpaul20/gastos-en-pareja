import { describe, it, expect } from "vitest";
import { parseAmount, formatAmountInput, formatStoredAmount } from "../amount";

describe("parseAmount", () => {
  describe("formato argentino — puntos como miles", () => {
    it("1.500.000 → 1500000", () =>
      expect(parseAmount("1.500.000")).toBe(1_500_000));
    it("3.210.000 → 3210000", () =>
      expect(parseAmount("3.210.000")).toBe(3_210_000));
    it("1.500 → 1500 (3 dígitos después del punto = miles)", () =>
      expect(parseAmount("1.500")).toBe(1_500));
  });

  describe("punto decimal", () => {
    it("1.5 → 1.5", () => expect(parseAmount("1.5")).toBe(1.5));
    it("1.50 → 1.5 (2 dígitos después del punto = decimal)", () =>
      expect(parseAmount("1.50")).toBe(1.5));
    it("0.99 → 0.99", () => expect(parseAmount("0.99")).toBe(0.99));
  });

  describe("coma como decimal (formato europeo sin miles)", () => {
    it("1500,50 → 1500.5", () => expect(parseAmount("1500,50")).toBe(1_500.5));
    it("99,9 → 99.9", () => expect(parseAmount("99,9")).toBe(99.9));
  });

  describe("formato europeo completo (punto=miles, coma=decimal)", () => {
    it("1.500,50 → 1500.5", () =>
      expect(parseAmount("1.500,50")).toBe(1_500.5));
    it("1.500.000,50 → 1500000.5", () =>
      expect(parseAmount("1.500.000,50")).toBe(1_500_000.5));
  });

  describe("prefijo $ y espacios", () => {
    it("$1500 → 1500", () => expect(parseAmount("$1500")).toBe(1_500));
    it("$ 1.500.000 → 1500000", () =>
      expect(parseAmount("$ 1.500.000")).toBe(1_500_000));
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

describe("formatAmountInput", () => {
  describe("agrupa miles con punto (es-AR)", () => {
    it("3640000 → 3.640.000", () =>
      expect(formatAmountInput("3640000")).toBe("3.640.000"));
    it("1500 → 1.500", () => expect(formatAmountInput("1500")).toBe("1.500"));
    it("999 → 999 (sin separador)", () =>
      expect(formatAmountInput("999")).toBe("999"));
    it("0 → 0", () => expect(formatAmountInput("0")).toBe("0"));
  });

  describe("idempotente — reformatear no rompe", () => {
    it("3.640.000 → 3.640.000", () =>
      expect(formatAmountInput("3.640.000")).toBe("3.640.000"));
    it("3.640,50 → 3.640,50", () =>
      expect(formatAmountInput("3.640,50")).toBe("3.640,50"));
  });

  describe("decimales con coma", () => {
    it("3640,5 → 3.640,5", () =>
      expect(formatAmountInput("3640,5")).toBe("3.640,5"));
    // La coma final sobrevive: si no, escribir "3640," la borraría y el
    // usuario nunca podría tipear un decimal.
    it("3640, → 3.640, (coma en progreso)", () =>
      expect(formatAmountInput("3640,")).toBe("3.640,"));
    it("3640,567 → 3.640,56 (trunca a 2 decimales)", () =>
      expect(formatAmountInput("3640,567")).toBe("3.640,56"));
    it("solo la primera coma cuenta", () =>
      expect(formatAmountInput("3640,5,9")).toBe("3.640,59"));
  });

  describe("descarta basura", () => {
    it("$ 3.640.000 → 3.640.000", () =>
      expect(formatAmountInput("$ 3.640.000")).toBe("3.640.000"));
    it("3a6b4c0 → 3.640 (sobreviven solo los dígitos)", () =>
      expect(formatAmountInput("3a6b4c0")).toBe("3.640"));
    it("cadena vacía → cadena vacía", () =>
      expect(formatAmountInput("")).toBe(""));
    it("abc → cadena vacía", () => expect(formatAmountInput("abc")).toBe(""));
  });

  describe("round-trip con parseAmount", () => {
    it("3640000 formateado y reparseado vuelve al mismo número", () =>
      expect(parseAmount(formatAmountInput("3640000"))).toBe(3_640_000));
    it("1500,25 formateado y reparseado vuelve al mismo número", () =>
      expect(parseAmount(formatAmountInput("1500,25"))).toBe(1_500.25));
  });
});

describe("formatStoredAmount", () => {
  // Supabase returns `numeric` as a dot-decimal STRING ("3640000.00"), which
  // formatAmountInput would read as thousands separators and mangle into
  // "36.400.005". This is the boundary that converts it safely.
  it('"3640000.00" → 3.640.000 (descarta los centavos vacíos)', () =>
    expect(formatStoredAmount("3640000.00")).toBe("3.640.000"));
  it('"3640000.50" → 3.640.000,5', () =>
    expect(formatStoredAmount("3640000.50")).toBe("3.640.000,5"));
  it("3640000 (number) → 3.640.000", () =>
    expect(formatStoredAmount(3_640_000)).toBe("3.640.000"));
  it("null → cadena vacía", () => expect(formatStoredAmount(null)).toBe(""));
  it("undefined → cadena vacía", () =>
    expect(formatStoredAmount(undefined)).toBe(""));
  it("0 → 0 (no se confunde con ausencia)", () =>
    expect(formatStoredAmount(0)).toBe("0"));
  it("valor no numérico → cadena vacía", () =>
    expect(formatStoredAmount("abc")).toBe(""));
  it("round-trip: lo que muestra vuelve al mismo número", () =>
    expect(parseAmount(formatStoredAmount("3640000.00"))).toBe(3_640_000));
});

describe("formatAmountInput — el signo negativo sobrevive", () => {
  // Stripping the minus would turn "-100" into a valid "100" and SAVE it —
  // silently banking a number the user never typed. Keeping the sign lets
  // positiveMoneyString reject it, which is what e2e TC-003 pins.
  it("-100 → -100", () => expect(formatAmountInput("-100")).toBe("-100"));
  it("-3640000 → -3.640.000", () =>
    expect(formatAmountInput("-3640000")).toBe("-3.640.000"));
  it("- solo → - (signo en progreso)", () =>
    expect(formatAmountInput("-")).toBe("-"));
  it("el negativo formateado sigue siendo negativo al reparsear", () =>
    expect(parseAmount(formatAmountInput("-3640000"))).toBe(-3_640_000));
  it("un menos que no está al principio se descarta", () =>
    expect(formatAmountInput("36-40")).toBe("3.640"));
});
