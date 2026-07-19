"use client";

import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/category-icons";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["expense_categories"]["Row"];

interface CategoryPickerProps {
  categories: Category[];
  value: string | null;
  onChange: (id: string | null) => void;
}

// Radix ToggleGroup requires string values; `null` (no category) is modeled
// as this sentinel and translated back to `null` in onValueChange.
const NONE_VALUE = "__none__";

// Re-skin shared by every chip — matches the original hand-rolled 12px/5x10
// pill metrics exactly. Colors are applied per data-state below since the
// shadcn Toggle base classes bake in their own (mismatched) bg/hover tokens.
// min-h-[46px] (not the declared 32px floor): the original fieldset never
// set align-items, so its default `stretch` made every chip in the row
// match the tallest sibling's natural content height (~46px, driven by the
// inherited line-height at 12px), overriding the 32px floor for all of
// them uniformly — reproduced here as a fixed floor since shadcn's Toggle
// base classes force their own coupled text-size/line-height that no
// longer produces that same 46px naturally.
const chipClassName = cn(
  "h-auto min-h-[46px] gap-1 rounded-full border-none px-2.5 py-[5px]",
  "text-xs font-medium whitespace-nowrap [font-family:var(--font-sans)]",
  "data-[state=off]:[background-color:var(--bg-sunken)] data-[state=off]:[color:var(--fg-2)]",
  "data-[state=off]:hover:[background-color:var(--bg-sunken)] data-[state=off]:hover:[color:var(--fg-2)]",
  "data-[state=on]:text-white data-[state=on]:hover:text-white",
);

export function CategoryPicker({
  categories,
  value,
  onChange,
}: Readonly<CategoryPickerProps>) {
  return (
    <ToggleGroup
      type="single"
      spacing={1}
      value={value ?? NONE_VALUE}
      onValueChange={(next) => {
        // Radix fires "" when re-clicking the already-active item (deselect).
        // The original chips have no deselect affordance — clicking the
        // active chip was a no-op — so ignore empty values here.
        if (!next) return;
        onChange(next === NONE_VALUE ? null : next);
      }}
      aria-label="Categoría del gasto"
      className={cn(
        "flex w-full flex-nowrap items-center gap-1.5 overflow-x-auto rounded-none border-0 bg-transparent p-0",
        "lg:flex-wrap lg:overflow-x-visible",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      <ToggleGroupItem
        value={NONE_VALUE}
        className={chipClassName}
        style={
          value === null ? { backgroundColor: "var(--accent)" } : undefined
        }
      >
        Sin categoría
      </ToggleGroupItem>
      {categories.map((cat) => {
        const Icon = getCategoryIcon(cat.name);
        const selected = value === cat.id;
        return (
          <ToggleGroupItem
            key={cat.id}
            value={cat.id}
            className={chipClassName}
            style={selected ? { backgroundColor: cat.color } : undefined}
          >
            <Icon size={14} className="size-3.5" aria-hidden="true" />{" "}
            {cat.name}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
