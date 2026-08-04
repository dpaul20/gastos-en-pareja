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
 * URL value standing for "only the expenses with NO category".
 *
 * `filterCategory === null` already means "sin filtro, mostrame todo", so the
 * uncategorized state had no way to be requested — which is why the biggest
 * bar in the breakdown used to be dead. A sentinel gives it a name. It is a
 * plain word on purpose: `expense_categories.id` is a uuid, so the two can
 * never collide (pinned by a test).
 */
export const UNCATEGORIZED_FILTER = "sin-categoria";

/**
 * Builds the `/expenses?cat={id}` href for a category breakdown row. "Sin
 * categoría" points at the sentinel rather than nowhere: not being able to
 * reach those rows meant not being able to categorise them.
 */
export function categoryExpensesHref(categoryId: string | null): string {
  return `/expenses?cat=${categoryId ?? UNCATEGORIZED_FILTER}`;
}

/**
 * Whether an expense belongs in the currently filtered list.
 *
 * `undefined` is treated as "no category", not as a separate case: a fijo
 * reads its category through `fixed_expense_templates?.category_id`, so a
 * missing template yields `undefined` where a variable would yield `null`.
 * Both mean the same thing to the person looking at the screen.
 */
export function matchesCategoryFilter(
  categoryId: string | null | undefined,
  filter: string | null,
): boolean {
  if (filter === null) return true;
  if (filter === UNCATEGORIZED_FILTER) return categoryId == null;
  return categoryId === filter;
}
