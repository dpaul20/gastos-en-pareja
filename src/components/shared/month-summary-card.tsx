"use client";

import { useState } from "react";
import { formatARS } from "@/lib/utils";
import type { MonthlyBalance } from "@/lib/utils/balance";
import type { MonthSummaryLines } from "@/lib/utils/summary-lines";
import { Card, CardContent } from "@/components/ui/card";

// ── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function Chevron({ open }: { readonly open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        width: 15,
        height: 15,
        stroke: open ? "var(--accent)" : "var(--fg-3)",
        strokeWidth: 2,
        fill: "none",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 150ms ease-out",
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function DetailLines({
  lines,
}: {
  readonly lines: MonthSummaryLines[keyof MonthSummaryLines];
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "0 16px 14px 34px",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {lines.map((line) => (
        <div
          key={line.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "var(--fg-2)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {line.label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--fg-1)",
            }}
          >
            {formatARS(line.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── COMPONENT ───────────────────────────────────────────────────────────────

type LinesKey = keyof MonthSummaryLines;

interface SummaryRow {
  label: string;
  amt: number;
  color: string;
  linesKey?: LinesKey;
}

export function MonthSummaryCard({
  balance,
  lines,
  isLoading = false,
}: {
  readonly balance?: MonthlyBalance;
  readonly lines?: MonthSummaryLines;
  readonly isLoading?: boolean;
}) {
  const [openKey, setOpenKey] = useState<LinesKey | null>(null);

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

  const rows: SummaryRow[] = [
    {
      label: "Ingresos",
      amt: balance.totalIncome,
      color: "var(--status-success-text)",
      linesKey: "ingresos",
    },
    {
      label: "Cuotas activas",
      amt: balance.installmentTotal,
      color: "var(--person-a)",
      linesKey: "cuotas",
    },
    {
      label: "Gastos fijos",
      amt: balance.fixedTotal,
      color: "var(--person-b)",
      linesKey: "fijos",
    },
    {
      label: "Variables",
      amt: balance.variableTotal,
      color: "var(--status-warning)",
      linesKey: "variables",
    },
  ];

  const savingsRow = {
    label: "Capacidad de ahorro",
    amt: balance.savingsCapacity,
    color:
      balance.savingsCapacity >= 0
        ? "var(--status-success-text)"
        : "var(--status-danger-text)",
  };

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

        {rows.map((row) => {
          const rowLines = row.linesKey ? lines?.[row.linesKey] : undefined;
          const expandable = !!rowLines && rowLines.length > 0;
          const open = expandable && openKey === row.linesKey;
          const dot = (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: row.color,
              }}
            />
          );
          const amount = (
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
          );
          const label = (
            <span
              style={{
                fontSize: 14,
                color: open ? "var(--fg-1)" : "var(--fg-2)",
                fontWeight: open ? 600 : 400,
                fontFamily: "var(--font-sans)",
              }}
            >
              {row.label}
            </span>
          );

          return (
            <div key={row.label}>
              {expandable ? (
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() =>
                    setOpenKey((k) =>
                      k === row.linesKey ? null : (row.linesKey ?? null),
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "none",
                    border: "none",
                    borderBottom: open
                      ? "none"
                      : "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {dot}
                    {label}
                    <Chevron open={open} />
                  </div>
                  {amount}
                </button>
              ) : (
                <div
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {dot}
                    {label}
                  </div>
                  {amount}
                </div>
              )}
              {open && rowLines && <DetailLines lines={rowLines} />}
            </div>
          );
        })}

        {/* Capacidad de ahorro — computed row, does not expand (shows formula) */}
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: savingsRow.color,
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  color: "var(--fg-1)",
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {savingsRow.label}
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                fontWeight: 600,
                color: savingsRow.color,
              }}
            >
              {formatARS(savingsRow.amt)}
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              color: "var(--fg-3)",
              fontFamily: "var(--font-mono)",
              paddingLeft: 16,
            }}
          >
            = Ingresos − (Cuotas + Fijos + Variables)
          </span>
        </div>

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
