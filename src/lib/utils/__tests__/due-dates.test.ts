import { describe, it, expect } from "vitest";
import { getUpcomingDues } from "../due-dates";
import type { Database } from "@/types/database";

type FixedExpenseInstanceRow =
  Database["public"]["Tables"]["fixed_expense_instances"]["Row"];
type FixedExpenseTemplateRow =
  Database["public"]["Tables"]["fixed_expense_templates"]["Row"];

type FixedExpenseInstance = FixedExpenseInstanceRow & {
  fixed_expense_templates: FixedExpenseTemplateRow;
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

function makeTemplate(
  overrides: Partial<FixedExpenseTemplateRow> = {},
): FixedExpenseTemplateRow {
  return {
    id: "tpl-1",
    couple_id: "c1",
    description: "Expensas",
    amount: 50_000,
    due_day: 10,
    active: true,
    category_id: null,
    requires_monthly_review: false,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeInstance(
  overrides: Partial<FixedExpenseInstanceRow> & {
    fixed_expense_templates?: Partial<FixedExpenseTemplateRow>;
  } = {},
): FixedExpenseInstance {
  const { fixed_expense_templates: templateOverrides, ...instanceOverrides } =
    overrides;
  return {
    id: "inst-1",
    couple_id: "c1",
    template_id: "tpl-1",
    month: "2026-05-01",
    paid: false,
    amount_override: null,
    status: "CONFIRMED",
    created_at: "2026-05-01T00:00:00Z",
    ...instanceOverrides,
    fixed_expense_templates: makeTemplate(templateOverrides),
  };
}

// today = 15 de mayo de 2026
const TODAY = new Date(2026, 4, 15); // month index 4 = mayo

// ── TESTS ─────────────────────────────────────────────────────────────────────

describe("getUpcomingDues", () => {
  it("retorna listas vacías cuando no hay instancias", () => {
    const result = getUpcomingDues([], TODAY);
    expect(result).toEqual({ today: [], upcoming: [], overdue: [] });
  });

  it("caso 1: instancia con due_day === today aparece en today[]", () => {
    const instance = makeInstance({ fixed_expense_templates: { due_day: 15 } });
    const result = getUpcomingDues([instance], TODAY);
    expect(result.today).toHaveLength(1);
    expect(result.today[0].instance.id).toBe("inst-1");
    expect(result.today[0].daysUntilDue).toBe(0);
    expect(result.today[0].status).toBe("today");
    expect(result.upcoming).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
  });

  it("caso 2: instancia con due_day en los próximos 7 días aparece en upcoming[]", () => {
    const instance = makeInstance({ fixed_expense_templates: { due_day: 20 } });
    const result = getUpcomingDues([instance], TODAY);
    expect(result.upcoming).toHaveLength(1);
    expect(result.upcoming[0].instance.id).toBe("inst-1");
    expect(result.upcoming[0].daysUntilDue).toBe(5);
    expect(result.upcoming[0].status).toBe("upcoming");
    expect(result.today).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
  });

  it("caso 3: instancia con paid = true NO aparece en ninguna lista", () => {
    const paidToday = makeInstance({
      paid: true,
      fixed_expense_templates: { due_day: 15 },
    });
    const paidUpcoming = makeInstance({
      id: "inst-2",
      paid: true,
      fixed_expense_templates: { due_day: 18 },
    });
    const paidOverdue = makeInstance({
      id: "inst-3",
      paid: true,
      fixed_expense_templates: { due_day: 10 },
    });
    const result = getUpcomingDues(
      [paidToday, paidUpcoming, paidOverdue],
      TODAY,
    );
    expect(result.today).toHaveLength(0);
    expect(result.upcoming).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
  });

  it("caso 4: due_day = 31 en mes de 30 días hace clamp al último día", () => {
    // Junio 2026 tiene 30 días. today = 30 de junio → due_day=31 clampea a 30 → vence hoy
    const todayJune30 = new Date(2026, 5, 30); // 30 de junio
    const instance = makeInstance({
      month: "2026-06-01",
      fixed_expense_templates: { due_day: 31 },
    });
    const result = getUpcomingDues([instance], todayJune30);
    expect(result.today).toHaveLength(1);
    expect(result.today[0].status).toBe("today");
  });

  it("caso 4b: due_day = 31 en febrero 2026 (28 días) clampea a 28", () => {
    const todayFeb28 = new Date(2026, 1, 28); // 28 de febrero 2026
    const instance = makeInstance({
      month: "2026-02-01",
      fixed_expense_templates: { due_day: 31 },
    });
    const result = getUpcomingDues([instance], todayFeb28);
    expect(result.today).toHaveLength(1);
    expect(result.today[0].status).toBe("today");
  });

  it("caso 5: sin vencimientos → retorna listas vacías", () => {
    // due_day muy en el futuro (> 7 días), fuera de la ventana
    const instance = makeInstance({ fixed_expense_templates: { due_day: 25 } });
    const result = getUpcomingDues([instance], TODAY);
    expect(result.today).toHaveLength(0);
    expect(result.upcoming).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
  });

  it("caso 6: instancia con due_day en el pasado del mes aparece en overdue[]", () => {
    const instance = makeInstance({ fixed_expense_templates: { due_day: 10 } });
    const result = getUpcomingDues([instance], TODAY);
    expect(result.overdue).toHaveLength(1);
    expect(result.overdue[0].instance.id).toBe("inst-1");
    expect(result.overdue[0].daysUntilDue).toBe(-5);
    expect(result.overdue[0].status).toBe("overdue");
    expect(result.today).toHaveLength(0);
    expect(result.upcoming).toHaveLength(0);
  });

  it("borde superior: due_day = today + 8 (fuera de ventana) → excluido", () => {
    // today = 15, due_day = 23 (8 días después) → outside 7-day window
    const instance = makeInstance({ fixed_expense_templates: { due_day: 23 } });
    const result = getUpcomingDues([instance], TODAY);
    expect(result.today).toHaveLength(0);
    expect(result.upcoming).toHaveLength(0);
    expect(result.overdue).toHaveLength(0);
  });

  it("borde inferior: due_day = mañana (today+1) aparece en upcoming[]", () => {
    const instance = makeInstance({ fixed_expense_templates: { due_day: 16 } });
    const result = getUpcomingDues([instance], TODAY);
    expect(result.upcoming).toHaveLength(1);
    expect(result.upcoming[0].daysUntilDue).toBe(1);
  });

  it("ordena cada sección por dueDay ascendente", () => {
    const instances = [
      makeInstance({ id: "a", fixed_expense_templates: { due_day: 20 } }),
      makeInstance({ id: "b", fixed_expense_templates: { due_day: 17 } }),
      makeInstance({ id: "c", fixed_expense_templates: { due_day: 19 } }),
    ];
    const result = getUpcomingDues(instances, TODAY);
    expect(result.upcoming.map((u) => u.instance.id)).toEqual(["b", "c", "a"]);
  });

  it("windowDays personalizado: due_day = today + 3 con window=2 → excluido de upcoming", () => {
    const instance = makeInstance({ fixed_expense_templates: { due_day: 18 } });
    const result = getUpcomingDues([instance], TODAY, 2);
    expect(result.upcoming).toHaveLength(0);
  });
});
