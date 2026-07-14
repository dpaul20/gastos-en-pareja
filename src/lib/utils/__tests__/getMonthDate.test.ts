import { describe, it, expect, afterEach } from "vitest";
import { getMonthDate } from "@/lib/utils";

// R3-A: fixed_expense_instances.month must be assigned from a SINGLE fixed
// timezone (America/Argentina/Buenos_Aires), whether getMonthDate runs
// server-side (Vercel, UTC) or client-side (browser, es-AR). These tests
// simulate both runtime timezones via process.env.TZ against the SAME
// absolute instant and assert getMonthDate agrees in both cases.
const ORIGINAL_TZ = process.env.TZ;

describe("getMonthDate — timezone determinism (R3-A)", () => {
  afterEach(() => {
    process.env.TZ = ORIGINAL_TZ;
  });

  it("retorna el mismo mes para el mismo instante bajo TZ=UTC y TZ=America/Argentina/Buenos_Aires", () => {
    // 2026-02-01 01:30 UTC == 2026-01-31 22:30 en Buenos Aires (UTC-3).
    // Un servidor corriendo en UTC (Vercel) y un cliente corriendo en
    // Buenos Aires deben coincidir en "enero" para este instante.
    const instant = new Date(Date.UTC(2026, 1, 1, 1, 30));

    process.env.TZ = "UTC";
    const monthUnderUtcProcess = getMonthDate(instant);

    process.env.TZ = "America/Argentina/Buenos_Aires";
    const monthUnderBaProcess = getMonthDate(instant);

    expect(monthUnderUtcProcess).toBe("2026-01-01");
    expect(monthUnderBaProcess).toBe("2026-01-01");
  });

  it("triangulación: instante lejos de cualquier frontera de mes también coincide entre TZs", () => {
    const instant = new Date(Date.UTC(2026, 6, 15, 12, 0)); // mediodía UTC, 15 jul

    process.env.TZ = "UTC";
    const monthUnderUtcProcess = getMonthDate(instant);

    process.env.TZ = "America/Argentina/Buenos_Aires";
    const monthUnderBaProcess = getMonthDate(instant);

    expect(monthUnderUtcProcess).toBe("2026-07-01");
    expect(monthUnderBaProcess).toBe("2026-07-01");
  });
});
