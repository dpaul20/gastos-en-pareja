"use client";

import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

// ToggleGroupItem re-skin matching the original hand-rolled segmented pill
// exactly. `flex-1!` is forced `!important` because Tailwind's own
// `shrink-0` (baked into ToggleGroupItem's base classes) lives in a
// different tailwind-merge conflict group than the `flex` shorthand group
// `flex-1` belongs to — `cn()` cannot dedupe/override across groups, so
// without `!important` the two `flex-shrink` declarations would race on
// CSS source order instead of deterministically producing the original's
// equal-width fill. `transition-colors` overrides the base's narrower
// `transition-[color,box-shadow]` so background-color animates on toggle,
// matching the original's `transition-colors`.
const segmentToggleItemClassName = cn(
  "h-auto flex-1! grow shrink basis-0 rounded-full border-none px-2 py-1.5",
  "text-[13px] font-semibold whitespace-nowrap transition-colors [font-family:var(--font-sans)]",
  "data-[state=off]:bg-transparent data-[state=off]:shadow-none data-[state=off]:[color:var(--fg-2)]",
  "data-[state=off]:hover:bg-transparent data-[state=off]:hover:[color:var(--fg-2)]",
  "data-[state=on]:[background-color:var(--bg-elevated)] data-[state=on]:[color:var(--accent)] data-[state=on]:shadow-[var(--shadow-sm)]",
  "data-[state=on]:hover:[background-color:var(--bg-elevated)] data-[state=on]:hover:[color:var(--accent)]",
);

export function SegmentedControl({
  active,
  onChange,
}: {
  readonly active: ExpenseFilter;
  readonly onChange: (filter: ExpenseFilter) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      spacing={1}
      value={active}
      onValueChange={(next) => {
        // Radix fires "" when re-clicking the already-active segment
        // (deselect). The original had no deselect affordance — clicking
        // the active segment was a no-op — so ignore empty values.
        if (!next) return;
        onChange(next as ExpenseFilter);
      }}
      aria-label="Filtrar gastos por tipo"
      className="flex w-full items-stretch gap-1 rounded-full border-0 [background-color:var(--bg-sunken)] p-1"
    >
      {FILTER_ORDER.map((f) => (
        <ToggleGroupItem
          key={f}
          value={f}
          data-testid={FILTER_TESTID[f]}
          className={segmentToggleItemClassName}
        >
          {FILTER_LABEL[f]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
