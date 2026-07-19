import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthSummaryCard } from "@/components/shared/month-summary-card";
import { formatARS, formatMonth } from "@/lib/utils";
import { calculateMonthlyBalance } from "@/lib/utils/balance";
import type { MonthlyData } from "@/lib/queries/use-monthly-data";

export function MonthDetail({
  month,
  data,
  isLoading = false,
  onBack,
}: {
  readonly month: string;
  readonly data: MonthlyData | undefined;
  readonly isLoading?: boolean;
  readonly onBack: () => void;
}) {
  const balance = data
    ? calculateMonthlyBalance({
        incomes: data.incomes,
        installmentPurchases: data.activeInstallmentPurchases,
        fixedExpenseInstances: data.fixedExpenseInstances,
        variableExpenses: data.variableExpenses,
      })
    : null;

  return (
    <div className="flex min-h-full flex-col [background-color:var(--bg-base)]">
      <div className="flex items-center gap-3 border-b [border-color:var(--border-subtle)] [background-color:var(--bg-elevated)] px-4 py-3.5">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="flex min-h-11 min-w-11 cursor-pointer items-center border-none bg-transparent p-1"
        >
          <ChevronLeft
            size={22}
            strokeWidth={2}
            className="[color:var(--fg-2)]"
          />
        </button>
        <span className="[font-family:var(--font-sans)] text-[17px] font-semibold [color:var(--fg-1)]">
          {formatMonth(month)}
        </span>
        <Badge variant="neutral">Solo lectura</Badge>
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 p-4">
        {isLoading && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2.5 rounded-[var(--radius-lg)] border [border-color:var(--border-subtle)] [background-color:var(--bg-elevated)] p-[18px]">
              <Skeleton className="h-3.5 w-[30%]" />
              <Skeleton className="h-[38px] w-[55%]" />
              <Skeleton className="h-4 w-[45%]" />
              <Skeleton className="h-1.5 rounded-full" />
            </div>
          </div>
        )}
        {!isLoading && balance && (
          <>
            <div className="rounded-[var(--radius-lg)] border [border-color:var(--border-subtle)] [background-color:var(--bg-elevated)] p-[18px] shadow-[var(--shadow-sm)]">
              <div className="mb-2 [font-family:var(--font-sans)] text-[11px] font-semibold tracking-[0.05em] [color:var(--fg-3)] uppercase">
                Balance del mes
              </div>
              <div
                className="ds-amount text-[32px] font-bold tracking-[-0.02em]"
                style={{
                  color:
                    balance.debtAmount > 0
                      ? "var(--status-danger-text)"
                      : "var(--status-success-text)",
                }}
              >
                {formatARS(balance.debtAmount)}
              </div>
              <div className="mt-1 [font-family:var(--font-sans)] text-sm [color:var(--fg-2)]">
                {balance.debtAmount > 0
                  ? "Diferencia entre aportes"
                  : "Todo equilibrado"}
              </div>
              <div className="mt-3.5 flex h-1.5 overflow-hidden rounded-full [background-color:var(--color-neutral-200)]">
                {balance.balances.map((b, i) => (
                  <div
                    key={b.userId}
                    style={{
                      width: `${Math.round(b.percentage * 100)}%`,
                      background:
                        i === 0 ? "var(--person-a)" : "var(--person-b)",
                    }}
                  />
                ))}
              </div>
            </div>
            <MonthSummaryCard balance={balance} isLoading={false} />
          </>
        )}
      </div>
    </div>
  );
}
