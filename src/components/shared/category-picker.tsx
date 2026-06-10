"use client";

import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["expense_categories"]["Row"];

interface CategoryPickerProps {
  categories: Category[];
  value: string | null;
  onChange: (id: string | null) => void;
}

export function CategoryPicker({
  categories,
  value,
  onChange,
}: Readonly<CategoryPickerProps>) {
  return (
    <fieldset
      className={cn(
        "flex flex-nowrap overflow-x-auto lg:flex-wrap lg:overflow-x-visible",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
      style={{
        gap: 6,
        margin: 0,
        padding: 0,
        border: "none",
        minInlineSize: 0,
      }}
    >
      <legend
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Categoría del gasto
      </legend>
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        style={{
          padding: "5px 10px",
          borderRadius: 99,
          border: "none",
          cursor: "pointer",
          background: value === null ? "var(--accent)" : "var(--bg-sunken)",
          color: value === null ? "white" : "var(--fg-2)",
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "var(--font-sans)",
          minHeight: 32,
        }}
      >
        Sin categoría
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.id)}
          aria-pressed={value === cat.id}
          style={{
            padding: "5px 10px",
            borderRadius: 99,
            border: "none",
            cursor: "pointer",
            background: value === cat.id ? cat.color : "var(--bg-sunken)",
            color: value === cat.id ? "white" : "var(--fg-2)",
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "var(--font-sans)",
            minHeight: 32,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span aria-hidden="true">{cat.icon}</span> {cat.name}
        </button>
      ))}
    </fieldset>
  );
}
