"use client";

import type { Tab } from "@/lib/queries/use-expense-save";

export type ExpenseFilter = Tab | "todo";

export const TAB_LABEL: Record<Tab, string> = {
  cuotas: "Cuotas",
  fijos: "Servicios",
  variables: "Compras",
};

export const TAB_TESTID: Record<Tab, string> = {
  cuotas: "tab-cuotas",
  fijos: "tab-servicios",
  variables: "tab-compras",
};

const FILTER_ORDER: readonly ExpenseFilter[] = [
  "todo",
  "cuotas",
  "fijos",
  "variables",
];

const FILTER_LABEL: Record<ExpenseFilter, string> = {
  todo: "Todo",
  ...TAB_LABEL,
};

const FILTER_TESTID: Record<ExpenseFilter, string> = {
  todo: "tab-todo",
  ...TAB_TESTID,
};

export function SegmentedControl({
  active,
  onChange,
}: {
  readonly active: ExpenseFilter;
  readonly onChange: (filter: ExpenseFilter) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filtrar gastos por tipo"
      className="flex w-full gap-1 rounded-full p-1"
      style={{ background: "var(--bg-sunken)" }}
    >
      {FILTER_ORDER.map((f) => {
        const isActive = active === f;
        return (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-testid={FILTER_TESTID[f]}
            onClick={() => onChange(f)}
            className="flex-1 cursor-pointer rounded-full px-2 py-1.5 text-[13px] font-semibold transition-colors"
            style={{
              background: isActive ? "var(--bg-elevated)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--fg-2)",
              boxShadow: isActive ? "var(--shadow-sm)" : "none",
              fontFamily: "var(--font-sans)",
            }}
          >
            {FILTER_LABEL[f]}
          </button>
        );
      })}
    </div>
  );
}
