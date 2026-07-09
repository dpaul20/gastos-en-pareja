"use client";

import { formatARS } from "@/lib/utils";
import type { MonthlyBalance } from "@/lib/utils/balance";
import { Card, CardContent } from "@/components/ui/card";

export function MonthSummaryCard({
  balance,
  isLoading = false,
}: {
  readonly balance?: MonthlyBalance;
  readonly isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card style={{ overflow: "hidden" }}>
        <CardContent className="p-0">
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontFamily: "var(--font-sans)",
              }}
            >
              Resumen del mes
            </div>
          </div>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: i < 2 ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              <div
                style={{
                  height: 14,
                  width: 100,
                  borderRadius: 6,
                  background: "var(--border-subtle)",
                }}
              />
              <div
                style={{
                  height: 14,
                  width: 60,
                  borderRadius: 6,
                  background: "var(--border-subtle)",
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!balance) return null;

  const rows = [
    {
      label: "Ingresos",
      amt: balance.totalIncome,
      color: "var(--status-success-text)",
    },
    {
      label: "Cuotas activas",
      amt: balance.installmentTotal,
      color: "var(--person-a)",
    },
    {
      label: "Gastos fijos",
      amt: balance.fixedTotal,
      color: "var(--person-b)",
    },
    {
      label: "Variables",
      amt: balance.variableTotal,
      color: "var(--status-warning)",
    },
    {
      label: "Capacidad de ahorro",
      amt: balance.savingsCapacity,
      color:
        balance.savingsCapacity >= 0
          ? "var(--status-success-text)"
          : "var(--status-danger-text)",
    },
  ];
  return (
    <Card style={{ overflow: "hidden" }}>
      <CardContent className="p-0">
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "var(--font-sans)",
            }}
          >
            Resumen del mes
          </div>
        </div>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom:
                i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: row.color,
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  color: "var(--fg-2)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {row.label}
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--fg-1)",
              }}
            >
              {formatARS(row.amt)}
            </span>
          </div>
        ))}
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-sunken)",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Total
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--fg-1)",
            }}
          >
            {formatARS(balance.totalExpenses)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
