"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatARS } from "@/lib/utils";
import { toggleFixedExpenseInstance } from "@/lib/actions/expenses";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type FixedExpenseInstance = MonthlyData["fixedExpenseInstances"][number];

export function FijoItem({
  fi,
  isLast,
}: {
  readonly fi: FixedExpenseInstance;
  readonly isLast: boolean;
}) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  return (
    <div
      style={{
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {fi.fixed_expense_templates.description}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--fg-3)",
            marginTop: 1,
            fontFamily: "var(--font-sans)",
          }}
        >
          Vence día {fi.fixed_expense_templates.due_day}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--fg-1)",
          marginRight: 8,
        }}
      >
        {formatARS(fi.fixed_expense_templates.amount)}
      </div>
      <button
        onClick={() =>
          startTransition(async () => {
            await toggleFixedExpenseInstance(fi.id, !fi.paid);
            queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
          })
        }
        style={{
          width: 28,
          height: 28,
          borderRadius: 99,
          cursor: "pointer",
          background: fi.paid
            ? "var(--status-success-subtle)"
            : "var(--bg-sunken)",
          border: `2px solid ${fi.paid ? "var(--status-success)" : "var(--border-default)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {fi.paid && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--status-success)"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    </div>
  );
}
