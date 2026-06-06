"use client";

import type { Tab } from "@/lib/queries/use-expense-save";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <Tabs value={active} onValueChange={(v) => onChange(v as Tab)}>
        <TabsList className="w-full">
          {(["cuotas", "fijos", "variables"] as Tab[]).map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              data-testid={TAB_TESTID[t]}
              className="flex-1"
            >
              {TAB_LABEL[t]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
