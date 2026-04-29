"use client";

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
}: CategoryPickerProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      <button
        type="button"
        onClick={() => onChange(null)}
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
          <span>{cat.icon}</span> {cat.name}
        </button>
      ))}
    </div>
  );
}
