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
        installmentPurchases: data.installmentPurchases,
        fixedExpenseInstances: data.fixedExpenseInstances,
        variableExpenses: data.variableExpenses,
      })
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          aria-label="Volver"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            minWidth: 44,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--fg-2)"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {formatMonth(month)}
        </span>
        <Badge variant="neutral">Solo lectura</Badge>
      </div>
      <div
        className="mx-auto w-full max-w-3xl"
        style={{
          flex: 1,
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                background: "var(--bg-elevated)",
                borderRadius: 16,
                padding: "18px",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <Skeleton style={{ height: 14, width: "30%" }} />
              <Skeleton style={{ height: 38, width: "55%" }} />
              <Skeleton style={{ height: 16, width: "45%" }} />
              <Skeleton style={{ height: 6, borderRadius: 99 }} />
            </div>
          </div>
        )}
        {!isLoading && balance && (
          <>
            <div
              style={{
                background: "var(--bg-elevated)",
                borderRadius: 16,
                padding: "18px",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--fg-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                  fontFamily: "var(--font-sans)",
                }}
              >
                Balance del mes
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 32,
                  fontWeight: 700,
                  color:
                    balance.debtAmount > 0
                      ? "var(--status-danger)"
                      : "var(--status-success)",
                  letterSpacing: "-0.02em",
                }}
              >
                {formatARS(balance.debtAmount)}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--fg-2)",
                  marginTop: 4,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {balance.debtAmount > 0
                  ? "Diferencia entre aportes"
                  : "Todo equilibrado"}
              </div>
              <div
                style={{
                  marginTop: 14,
                  background: "var(--color-neutral-200)",
                  borderRadius: 99,
                  height: 6,
                  display: "flex",
                  overflow: "hidden",
                }}
              >
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
