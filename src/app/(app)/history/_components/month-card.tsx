import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatARS, formatMonth } from "@/lib/utils";
import { calculateMonthlyBalance } from "@/lib/utils/balance";
import type { MonthlyData } from "@/lib/queries/use-monthly-data";

export function MonthCard({
  month,
  data,
  isLoading,
  onClick,
  hideIfEmpty = false,
}: {
  readonly month: string;
  readonly data: MonthlyData | undefined;
  readonly isLoading: boolean;
  readonly onClick: () => void;
  readonly hideIfEmpty?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5 rounded-[14px] border [border-color:var(--border-subtle)] [background-color:var(--bg-elevated)] p-4 shadow-[var(--shadow-sm)]">
        <Skeleton className="h-5 w-[40%]" />
        <Skeleton className="h-4 w-[60%]" />
        <Skeleton className="h-1 rounded-full" />
      </div>
    );
  }

  const balance = data
    ? calculateMonthlyBalance({
        incomes: data.incomes,
        installmentPurchases: data.activeInstallmentPurchases,
        fixedExpenseInstances: data.fixedExpenseInstances,
        variableExpenses: data.variableExpenses,
      })
    : null;

  const myPct = balance?.balances[0]
    ? Math.round(balance.balances[0].percentage * 100)
    : 50;

  // Hide months with no data when hideIfEmpty is true
  if (hideIfEmpty && (!balance || balance.totalExpenses === 0)) return null;

  if (!balance || balance.totalExpenses === 0) {
    return (
      <div className="rounded-[14px] border [border-color:var(--border-subtle)] [background-color:var(--bg-elevated)] p-4 opacity-60 shadow-[var(--shadow-sm)]">
        <div className="[font-family:var(--font-sans)] text-[15px] font-semibold [color:var(--fg-1)]">
          {formatMonth(month)}
        </div>
        <div className="mt-1 [font-family:var(--font-sans)] text-[13px] [color:var(--fg-3)]">
          Sin datos
        </div>
      </div>
    );
  }

  return (
    <button
      data-testid="month-card"
      onClick={onClick}
      className="w-full cursor-pointer rounded-[14px] border [border-color:var(--border-subtle)] [background-color:var(--bg-elevated)] p-4 text-left shadow-[var(--shadow-sm)]"
    >
      <div className="mb-2.5 flex items-start justify-between">
        <div className="[font-family:var(--font-sans)] text-[15px] font-semibold [color:var(--fg-1)]">
          {formatMonth(month)}
        </div>
        <ChevronRight
          size={16}
          strokeWidth={2}
          className="[color:var(--fg-3)]"
        />
      </div>
      <div className="mb-2 flex items-center justify-between">
        <span className="[font-family:var(--font-sans)] text-xs [color:var(--fg-2)]">
          {balance.debtAmount > 0
            ? `Diferencia: ${formatARS(balance.debtAmount)}`
            : "Equilibrado"}
        </span>
        <span
          className="ds-amount text-base font-bold"
          style={{
            color:
              balance.debtAmount > 0
                ? "var(--status-danger-text)"
                : "var(--status-success-text)",
          }}
        >
          {formatARS(balance.totalExpenses)}
        </span>
      </div>
      <div className="flex h-1 overflow-hidden rounded-full [background-color:var(--border-default)]">
        <div style={{ width: `${myPct}%`, background: "var(--person-a)" }} />
        <div className="flex-1" style={{ background: "var(--person-b)" }} />
      </div>
    </button>
  );
}
