import { describe, it, expect } from "vitest";
import { resolveReferenceAmount } from "../reference-amount";
import type { Database } from "@/types/database";

type FixedExpenseTemplate =
  Database["public"]["Tables"]["fixed_expense_templates"]["Row"];
type FixedExpenseInstance =
  Database["public"]["Tables"]["fixed_expense_instances"]["Row"] & {
    fixed_expense_templates: FixedExpenseTemplate;
  };

function makeTemplate(
  overrides: Partial<FixedExpenseTemplate> = {},
): FixedExpenseTemplate {
  return {
    id: "tpl-epec",
    couple_id: "c1",
    category_id: null,
    description: "Epec",
    amount: 72_375,
    due_day: 25,
    active: true,
    is_shared: true,
    owner_user_id: null,
    requires_monthly_review: false,
    awaits_bill: true,
    created_at: "",
    ...overrides,
  };
}

function makeInstance(
  overrides: Partial<FixedExpenseInstance> = {},
  template: FixedExpenseTemplate = makeTemplate(),
): FixedExpenseInstance {
  return {
    id: "fi-prev",
    couple_id: "c1",
    template_id: template.id,
    month: "2026-06-01",
    due_day: null,
    paid: false,
    paid_by_user_id: null,
    amount_override: null,
    billed_at: null,
    status: "CONFIRMED",
    created_at: "",
    fixed_expense_templates: template,
    ...overrides,
  };
}

describe("resolveReferenceAmount", () => {
  it("returns null when there is no previous-month instance (brand-new service)", () => {
    expect(resolveReferenceAmount(null)).toBeNull();
    expect(resolveReferenceAmount(undefined)).toBeNull();
  });

  it("returns the billed amount when last month's instance was CONFIRMED with an override", () => {
    const instance = makeInstance({
      status: "CONFIRMED",
      amount_override: 42_785,
    });
    expect(resolveReferenceAmount(instance)).toBe(42_785);
  });

  it("falls back to the template amount when CONFIRMED with no override", () => {
    const instance = makeInstance({
      status: "CONFIRMED",
      amount_override: null,
    });
    expect(resolveReferenceAmount(instance)).toBe(72_375);
  });

  it("still resolves for a legacy PENDING_CONFIRMATION instance (D2 — counts at full weight)", () => {
    const instance = makeInstance({
      status: "PENDING_CONFIRMATION",
      amount_override: 96_991,
    });
    expect(resolveReferenceAmount(instance)).toBe(96_991);
  });

  it("CRITICAL: returns null when last month's instance was ITSELF AWAITING_BILL — never fabricates template.amount", () => {
    const instance = makeInstance({
      status: "AWAITING_BILL",
      amount_override: null,
    });
    // If this ever returns 72_375 (the template amount), the reference line
    // would print "El mes pasado pagaste $72.375" for a bill that was NEVER
    // actually billed last month either — a fabricated fact. Must hide instead.
    expect(resolveReferenceAmount(instance)).toBeNull();
  });
});
