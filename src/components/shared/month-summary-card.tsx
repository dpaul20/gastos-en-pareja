"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn, formatARS } from "@/lib/utils";
import type { MonthlyBalance } from "@/lib/utils/balance";
import type { MonthSummaryLines } from "@/lib/utils/summary-lines";
import { Card, CardContent } from "@/components/ui/card";

// ── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function Chevron({ open }: { readonly open: boolean }) {
  return (
    <ChevronRight
      size={15}
      strokeWidth={2}
      className={cn(
        "transition-transform duration-150 ease-out",
        open ? "rotate-90 [color:var(--accent)]" : "[color:var(--fg-3)]",
      )}
    />
  );
}

function DetailLines({
  lines,
}: {
  readonly lines: MonthSummaryLines[keyof MonthSummaryLines];
}) {
  return (
    <div className="flex flex-col gap-2 border-b [border-color:var(--border-subtle)] pt-0 pr-4 pb-3.5 pl-[34px]">
      {lines.map((line) => (
        <div key={line.id} className="flex items-center justify-between">
          <span className="[font-family:var(--font-sans)] text-[13px] [color:var(--fg-2)]">
            {line.label}
          </span>
          <span className="ds-amount text-[13px] font-semibold [color:var(--fg-1)]">
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
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b [border-color:var(--border-subtle)] px-4 py-3.5">
            <div className="[font-family:var(--font-sans)] text-[11px] font-semibold tracking-[0.05em] [color:var(--fg-3)] uppercase">
              Resumen del mes
            </div>
          </div>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between px-4 py-3.5",
                i < 2 && "border-b [border-color:var(--border-subtle)]",
              )}
            >
              <div className="h-3.5 w-[100px] rounded-md [background-color:var(--border-subtle)]" />
              <div className="h-3.5 w-[60px] rounded-md [background-color:var(--border-subtle)]" />
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
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="border-b [border-color:var(--border-subtle)] px-4 py-3.5">
          <div className="[font-family:var(--font-sans)] text-[11px] font-semibold tracking-[0.05em] [color:var(--fg-3)] uppercase">
            Resumen del mes
          </div>
        </div>

        {rows.map((row) => {
          const rowLines = row.linesKey ? lines?.[row.linesKey] : undefined;
          const expandable = !!rowLines && rowLines.length > 0;
          const open = expandable && openKey === row.linesKey;
          const dot = (
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: row.color }}
            />
          );
          const amount = (
            <span className="ds-amount text-[14px] font-semibold [color:var(--fg-1)]">
              {formatARS(row.amt)}
            </span>
          );
          const label = (
            <span
              className={cn(
                "[font-family:var(--font-sans)] text-[14px]",
                open
                  ? "font-semibold [color:var(--fg-1)]"
                  : "font-normal [color:var(--fg-2)]",
              )}
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
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-4 py-3.5 text-left",
                    !open && "border-b [border-color:var(--border-subtle)]",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {dot}
                    {label}
                    <Chevron open={open} />
                  </div>
                  {amount}
                </button>
              ) : (
                <div className="flex items-center justify-between border-b [border-color:var(--border-subtle)] px-4 py-3.5">
                  <div className="flex items-center gap-2">
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
        <div className="flex flex-col gap-1 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: savingsRow.color }}
              />
              <span className="[font-family:var(--font-sans)] text-[14px] font-semibold [color:var(--fg-1)]">
                {savingsRow.label}
              </span>
            </div>
            <span
              className="ds-amount text-[14px] font-semibold"
              style={{ color: savingsRow.color }}
            >
              {formatARS(savingsRow.amt)}
            </span>
          </div>
          <span className="pl-4 [font-family:var(--font-mono)] text-[12px] [color:var(--fg-3)]">
            = Ingresos − (Cuotas + Fijos + Variables)
          </span>
        </div>

        <div className="flex items-center justify-between [background-color:var(--bg-sunken)] px-4 py-3.5">
          <span className="[font-family:var(--font-sans)] text-[14px] font-semibold [color:var(--fg-1)]">
            Total
          </span>
          <span className="ds-amount text-[16px] font-bold [color:var(--fg-1)]">
            {formatARS(balance.totalExpenses)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
