"use client";

import { Fragment, useState } from "react";
import { ChevronRight, UserRound } from "lucide-react";
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
  categoryTotal,
  categoryName,
  panelId,
}: {
  readonly lines: MonthSummaryLines[keyof MonthSummaryLines];
  readonly categoryTotal: number;
  readonly categoryName: string;
  readonly panelId: string;
}) {
  return (
    <div
      id={panelId}
      role="region"
      aria-label={`Desglose de ${categoryName}`}
      className="mx-3 mb-3 rounded-[var(--radius-md)] border [border-color:var(--border-subtle)] [background-color:var(--bg-sunken)] px-3 py-3"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.04em] [color:var(--fg-3)] uppercase">
          Desglose
        </span>
        <span className="text-[11px] [color:var(--fg-3)]">
          {lines.length} {lines.length === 1 ? "concepto" : "conceptos"}
        </span>
      </div>
      <dl className="m-0 flex flex-col gap-2">
        {lines.map((line) => (
          <div
            key={line.id}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <dt className="[font-family:var(--font-sans)] text-[13px] break-words [color:var(--fg-2)]">
                {line.label}
              </dt>
              {line.attribution && (
                <div className="flex items-center gap-1 text-[11px] [color:var(--fg-3)]">
                  <UserRound aria-hidden size={12} strokeWidth={1.8} />
                  <span>{line.attribution.label}:</span>
                  <span className="font-medium [color:var(--fg-2)]">
                    {line.attribution.name}
                  </span>
                </div>
              )}
            </div>
            <dd className="ds-amount m-0 shrink-0 text-[13px] font-medium [color:var(--fg-1)]">
              {formatARS(line.amount)}
            </dd>
          </div>
        ))}
        <div className="mt-1 flex items-baseline justify-between gap-3 border-t [border-color:var(--border-default)] pt-2">
          <dt className="text-[12px] font-semibold [color:var(--fg-1)]">
            Total de la categoría
          </dt>
          <dd className="ds-amount m-0 shrink-0 text-[13px] font-bold [color:var(--fg-1)]">
            {formatARS(categoryTotal)}
          </dd>
        </div>
      </dl>
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
  section?: string;
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
      section: "Gastos del mes",
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
          const panelId = `summary-detail-${row.linesKey}`;
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
            <Fragment key={row.label}>
              {row.section && (
                <div className="border-t [border-color:var(--border-subtle)] px-4 pt-4 pb-1">
                  <span className="text-[11px] font-semibold tracking-[0.06em] [color:var(--fg-3)] uppercase">
                    {row.section}
                  </span>
                </div>
              )}
              <div>
                {expandable ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() =>
                      setOpenKey((k) =>
                        k === row.linesKey ? null : (row.linesKey ?? null),
                      )
                    }
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-4 py-3 text-left transition-colors duration-150 hover:bg-[var(--bg-sunken)]",
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
                  <div className="flex items-center justify-between border-b [border-color:var(--border-subtle)] px-4 py-3">
                    <div className="flex items-center gap-2">
                      {dot}
                      <div className="flex min-w-0 flex-col items-start">
                        {label}
                        {row.amt === 0 && (
                          <span className="text-[11px] [color:var(--fg-3)]">
                            {row.label === "Variables"
                              ? "Sin gastos este mes"
                              : "Sin movimientos este mes"}
                          </span>
                        )}
                      </div>
                    </div>
                    {amount}
                  </div>
                )}
                {open && rowLines && (
                  <DetailLines
                    lines={rowLines}
                    categoryTotal={row.amt}
                    categoryName={row.label}
                    panelId={panelId}
                  />
                )}
              </div>
            </Fragment>
          );
        })}

        <div className="flex items-center justify-between border-t [border-color:var(--border-subtle)] [background-color:var(--bg-sunken)] px-4 py-3.5">
          <span className="[font-family:var(--font-sans)] text-[14px] font-semibold [color:var(--fg-1)]">
            Gastos totales
          </span>
          <span className="ds-amount text-[16px] font-bold [color:var(--fg-1)]">
            {formatARS(balance.totalExpenses)}
          </span>
        </div>

        {/* Savings capacity is the takeaway: income minus all monthly expenses. */}
        <div
          className="m-3 rounded-[var(--radius-lg)] p-4"
          style={{
            backgroundColor:
              balance.savingsCapacity >= 0
                ? "var(--status-success-subtle)"
                : "var(--status-danger-subtle)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="[font-family:var(--font-sans)] text-[14px] font-semibold [color:var(--fg-1)]">
                Capacidad de ahorro
              </span>
              <span className="text-[12px] leading-snug [color:var(--fg-2)]">
                Ingresos menos gastos totales
              </span>
            </div>
            <span
              className="ds-amount shrink-0 text-[18px] font-bold"
              style={{ color: savingsRow.color }}
            >
              {formatARS(savingsRow.amt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
