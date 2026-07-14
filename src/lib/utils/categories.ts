import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["expense_categories"]["Row"];

interface ExpenseWithCategory {
  amount: number;
  category_id: string | null;
}

export interface CategoryGroup {
  category: Category | null;
  total: number;
}

export function groupByCategory(
  expenses: ExpenseWithCategory[],
  categories: Category[],
): CategoryGroup[] {
  const map = new Map<string | null, number>();

  for (const e of expenses) {
    const key = e.category_id ?? null;
    map.set(key, (map.get(key) ?? 0) + e.amount);
  }

  const result: CategoryGroup[] = [];

  for (const [id, total] of map.entries()) {
    const category = id ? (categories.find((c) => c.id === id) ?? null) : null;
    result.push({ category, total });
  }

  return result.sort((a, b) => b.total - a.total);
}

/**
 * Builds the `/expenses?cat={id}` href for a category breakdown row (Commit 7
 * — category navigation). Returns `null` for "Sin categoría" (`categoryId ===
 * null`), which per design MUST NOT navigate — callers use this to decide
 * whether a row is clickable at all, not just where it points.
 */
export function categoryExpensesHref(categoryId: string | null): string | null {
  return categoryId ? `/expenses?cat=${categoryId}` : null;
}
