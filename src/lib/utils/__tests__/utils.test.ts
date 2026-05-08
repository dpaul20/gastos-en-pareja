import { describe, it, expect } from "vitest";
import {
  formatARS,
  getMonthDate,
  formatMonth,
  getPreviousMonthDate,
} from "@/lib/utils";
import { getInitials } from "@/lib/utils/initials";

describe("formatARS", () => {
  it("formatea números enteros con separador de miles (ARS)", () => {
    expect(formatARS(1_320_004)).toBe("$1.320.004");
  });

  it("formatea cero", () => {
    expect(formatARS(0)).toBe("$0");
  });

  it("formatea números pequeños sin separador", () => {
    expect(formatARS(500)).toBe("$500");
  });

  it("redondea decimales al entero más cercano", () => {
    // 55000.5 → 55001 en ARS con punto de miles: $55.001
    expect(formatARS(55_000.5)).toBe("$55.001");
  });

  it("formatea montos reales de las hojas de cálculo", () => {
    expect(formatARS(71_439)).toBe("$71.439");
    expect(formatARS(39_169)).toBe("$39.169");
    expect(formatARS(110_608)).toBe("$110.608");
  });
});

describe("getMonthDate", () => {
  it("retorna el primer día del mes actual en formato YYYY-MM-01", () => {
    const result = getMonthDate();
    expect(result).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it("retorna el primer día del mes de la fecha dada", () => {
    const date = new Date(2026, 3, 15); // 15 de abril 2026
    expect(getMonthDate(date)).toBe("2026-04-01");
  });

  it("retorna el primer día de enero correctamente", () => {
    const date = new Date(2026, 0, 31); // 31 de enero 2026
    expect(getMonthDate(date)).toBe("2026-01-01");
  });

  it("padea el mes con cero si es de un dígito", () => {
    const date = new Date(2026, 0, 1); // enero = mes 0
    expect(getMonthDate(date)).toBe("2026-01-01");
  });
});

describe("formatMonth", () => {
  it("formatea fecha ISO a nombre de mes en español capitalizado", () => {
    expect(formatMonth("2026-04-01")).toMatch(/^Abril 2026$/);
  });

  it("capitaliza la primera letra", () => {
    const result = formatMonth("2026-01-01");
    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
  });

  it("formatea diciembre correctamente", () => {
    expect(formatMonth("2025-12-01")).toMatch(/^Diciembre 2025$/);
  });

  it("no incluye el número de día en el resultado", () => {
    const result = formatMonth("2026-04-15");
    expect(result).not.toMatch(/\b15\b/);
  });
});

describe("getPreviousMonthDate", () => {
  it("retorna el mes anterior en formato YYYY-MM-01", () => {
    const date = new Date(2026, 3, 15); // abril 2026
    expect(getPreviousMonthDate(date)).toBe("2026-03-01");
  });

  it("retorna diciembre del año anterior cuando el mes es enero", () => {
    const date = new Date(2026, 0, 15); // enero 2026
    expect(getPreviousMonthDate(date)).toBe("2025-12-01");
  });

  it("retorna noviembre cuando el mes es diciembre", () => {
    const date = new Date(2025, 11, 1); // diciembre 2025
    expect(getPreviousMonthDate(date)).toBe("2025-11-01");
  });

  it("retorna un string con formato YYYY-MM-01 sin argumento", () => {
    const result = getPreviousMonthDate();
    expect(result).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it("padea el mes con cero si es de un dígito", () => {
    const date = new Date(2026, 2, 1); // marzo 2026
    expect(getPreviousMonthDate(date)).toBe("2026-02-01");
  });

  it("es consistente con getMonthDate: el mes anterior al primer día de enero local es diciembre", () => {
    const date = new Date(2026, 0, 1); // enero 2026 en local time
    expect(getMonthDate(date)).toBe("2026-01-01");
    expect(getPreviousMonthDate(date)).toBe("2025-12-01");
  });
});

describe("getInitials", () => {
  it("retorna las dos primeras iniciales en mayúsculas", () => {
    expect(getInitials("Juan Pérez")).toBe("JP");
  });

  it("retorna una sola inicial si hay un solo nombre", () => {
    expect(getInitials("Carlos")).toBe("C");
  });

  it("trunca a 2 caracteres si hay más de dos palabras", () => {
    expect(getInitials("María José García")).toBe("MJ");
  });

  it("retorna string vacío para input vacío", () => {
    expect(getInitials("")).toBe("");
  });
});
