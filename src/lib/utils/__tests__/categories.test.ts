import { describe, it, expect } from "vitest";
import { groupByCategory, categoryExpensesHref } from "../categories";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["expense_categories"]["Row"];

const makeCategory = (id: string, name: string): Category => ({
  id,
  name,
  icon: "📦",
  color: "#000",
  couple_id: null,
  sort_order: 0,
  created_at: "",
});

const vivienda = makeCategory("cat-1", "Vivienda");
const comida = makeCategory("cat-2", "Comida");
const categories = [vivienda, comida];

describe("groupByCategory", () => {
  it("agrupa correctamente por categoría", () => {
    const expenses = [
      { amount: 100_000, category_id: "cat-1" },
      { amount: 50_000, category_id: "cat-1" },
      { amount: 30_000, category_id: "cat-2" },
    ];
    const result = groupByCategory(expenses, categories);

    expect(result).toHaveLength(2);
    const viv = result.find((r) => r.category?.id === "cat-1");
    const com = result.find((r) => r.category?.id === "cat-2");
    expect(viv?.total).toBe(150_000);
    expect(com?.total).toBe(30_000);
  });

  it("gastos sin categoría se agrupan bajo null", () => {
    const expenses = [
      { amount: 5_000, category_id: null },
      { amount: 3_000, category_id: null },
    ];
    const result = groupByCategory(expenses, categories);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBeNull();
    expect(result[0].total).toBe(8_000);
  });

  it("mezcla de gastos con y sin categoría", () => {
    const expenses = [
      { amount: 80_000, category_id: "cat-1" },
      { amount: 10_000, category_id: null },
    ];
    const result = groupByCategory(expenses, categories);

    expect(result).toHaveLength(2);
    expect(result[0].total).toBe(80_000); // ordenado por total desc
    expect(result[1].total).toBe(10_000);
  });

  it("categoría no encontrada en la lista retorna null", () => {
    const expenses = [{ amount: 5_000, category_id: "unknown-id" }];
    const result = groupByCategory(expenses, categories);

    expect(result[0].category).toBeNull();
    expect(result[0].total).toBe(5_000);
  });

  it("lista vacía de gastos retorna array vacío", () => {
    expect(groupByCategory([], categories)).toHaveLength(0);
  });
});

// ── categoryExpensesHref (Commit 7 — category navigation) ──────────────────────

describe("categoryExpensesHref", () => {
  it("retorna la URL filtrada para un categoryId real", () => {
    expect(categoryExpensesHref("cat-1")).toBe("/expenses?cat=cat-1");
  });

  it("retorna null para 'Sin categoría' (categoryId null) — no navega", () => {
    expect(categoryExpensesHref(null)).toBeNull();
  });
});
