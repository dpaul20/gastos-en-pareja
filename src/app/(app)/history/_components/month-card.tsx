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
      <div
        style={{
          background: "var(--bg-elevated)",
          borderRadius: 14,
          padding: "16px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Skeleton style={{ height: 20, width: "40%" }} />
        <Skeleton style={{ height: 16, width: "60%" }} />
        <Skeleton style={{ height: 4, borderRadius: 99 }} />
      </div>
    );
  }

  const balance = data
    ? calculateMonthlyBalance({
        incomes: data.incomes,
        installmentPurchases: data.installmentPurchases,
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
      <div
        style={{
          background: "var(--bg-elevated)",
          borderRadius: 14,
          padding: "16px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          opacity: 0.6,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {formatMonth(month)}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--fg-3)",
            marginTop: 4,
            fontFamily: "var(--font-sans)",
          }}
        >
          Sin datos
        </div>
      </div>
    );
  }

  return (
    <button
      data-testid="month-card"
      onClick={onClick}
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 14,
        padding: "16px",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
        textAlign: "left",
        cursor: "pointer",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {formatMonth(month)}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--fg-3)"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "var(--fg-2)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {balance.debtAmount > 0
            ? `Diferencia: ${formatARS(balance.debtAmount)}`
            : "Equilibrado"}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 16,
            fontWeight: 700,
            color:
              balance.debtAmount > 0
                ? "var(--status-danger-text)"
                : "var(--status-success-text)",
          }}
        >
          {formatARS(balance.totalExpenses)}
        </span>
      </div>
      <div
        style={{
          background: "var(--border-default)",
          borderRadius: 99,
          height: 4,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${myPct}%`, background: "var(--person-a)" }} />
        <div style={{ flex: 1, background: "var(--person-b)" }} />
      </div>
    </button>
  );
}
