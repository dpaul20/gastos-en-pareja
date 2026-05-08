"use client";

import type { Tab } from "@/lib/queries/use-expense-save";

export const TAB_LABEL: Record<Tab, string> = {
  cuotas: "Cuotas",
  fijos: "Servicios",
  variables: "Compras",
};

const TAB_TESTID: Record<Tab, string> = {
  cuotas: "tab-cuotas",
  fijos: "tab-servicios",
  variables: "tab-compras",
};

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
            data-testid={TAB_TESTID[t]}
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
              minHeight: 36,
            }}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
