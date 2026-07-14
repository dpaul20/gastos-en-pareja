import { describe, it, expect } from "vitest";
import { isTemplateActiveInMonth } from "../month-gating";

describe("isTemplateActiveInMonth", () => {
  it("el mes de creación de la plantilla es el primer mes activo", () => {
    expect(isTemplateActiveInMonth("2026-04-15T10:00:00Z", "2026-04-01")).toBe(
      true,
    );
  });

  it("un mes anterior a la creación de la plantilla está inactivo (Bug 1 Leak B)", () => {
    expect(isTemplateActiveInMonth("2026-04-15T10:00:00Z", "2026-03-01")).toBe(
      false,
    );
  });

  it("un mes posterior a la creación de la plantilla está activo", () => {
    expect(isTemplateActiveInMonth("2026-04-15T10:00:00Z", "2026-07-01")).toBe(
      true,
    );
  });
});
