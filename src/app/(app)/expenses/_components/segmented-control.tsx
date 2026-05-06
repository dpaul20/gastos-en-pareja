"use client";

import type { Tab } from "@/lib/queries/use-expense-save";

export function SegmentedControl({
  active,
  onChange,
}: {
  readonly active: Tab;
  readonly onChange: (t: Tab) => void;
}) {
  return (
    <div
      style={{
        padding: "10px 16px",
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          background: "var(--bg-sunken)",
          borderRadius: 10,
          padding: 3,
          display: "flex",
          gap: 2,
        }}
      >
        {(["cuotas", "fijos", "variables"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: active === t ? "var(--bg-elevated)" : "transparent",
              color: active === t ? "var(--accent)" : "var(--fg-2)",
              fontWeight: active === t ? 600 : 500,
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              boxShadow: active === t ? "var(--shadow-sm)" : "none",
              transition: "all 150ms",
              textTransform: "capitalize",
              minHeight: 36,
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
