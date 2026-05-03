"use client";

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Badge } from "@/components/shared/badge";
import { formatARS, formatMonth } from "@/lib/utils";
import {
  useCoupleMember,
  monthlyDataQueryOptions,
  type MonthlyData,
} from "@/lib/queries/use-monthly-data";
import { calculateMonthlyBalance } from "@/lib/utils/balance";
import { getHistoryMonths } from "@/lib/queries/history";
import { MonthSummaryCard } from "@/components/shared/month-summary-card";

function MonthCard({
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
  const balance = data
    ? calculateMonthlyBalance({
        incomes: data.incomes,
        installmentPurchases: data.installmentPurchases,
        fixedExpenseInstances: data.fixedExpenseInstances as Parameters<
          typeof calculateMonthlyBalance
        >[0]["fixedExpenseInstances"],
        variableExpenses: data.variableExpenses,
      })
    : null;

  const myPct = balance?.balances[0]
    ? Math.round(balance.balances[0].percentage * 100)
    : 50;

  if (isLoading) return null;

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
                ? "var(--status-danger)"
                : "var(--status-success)",
          }}
        >
          {formatARS(balance.totalExpenses)}
        </span>
      </div>
      <div
        style={{
          background: "var(--color-neutral-200)",
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

function MonthDetail({
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
        fixedExpenseInstances: data.fixedExpenseInstances as Parameters<
          typeof calculateMonthlyBalance
        >[0]["fixedExpenseInstances"],
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
        style={{
          flex: 1,
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {balance && (
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
            <MonthSummaryCard
              balance={balance ?? undefined}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: member } = useCoupleMember();
  const coupleId = member?.couple_id ?? null;
  const months = getHistoryMonths();

  const queries = useQueries({
    queries: coupleId
      ? months.map((month) => monthlyDataQueryOptions(coupleId, month))
      : [],
  });

  const isLoading = queries.some((q) => q.isLoading);

  if (selected && coupleId) {
    const idx = months.indexOf(selected);
    return (
      <MonthDetail
        month={selected}
        data={queries[idx]?.data ?? undefined}
        isLoading={queries[idx]?.isLoading ?? false}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <main
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
          padding: "14px 20px",
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
            margin: 0,
          }}
        >
          Historial
        </h1>
        {isLoading && (
          <div
            style={{
              fontSize: 12,
              color: "var(--fg-3)",
              marginTop: 4,
              fontFamily: "var(--font-sans)",
            }}
          >
            Cargando…
          </div>
        )}
      </div>
      <div
        style={{
          flex: 1,
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {coupleId ? (
          months.map((month, i) => (
            <MonthCard
              key={month}
              month={month}
              data={queries[i]?.data ?? null}
              isLoading={queries[i]?.isLoading ?? false}
              onClick={() => setSelected(month)}
              hideIfEmpty
            />
          ))
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              color: "var(--fg-3)",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
            }}
          >
            Configurá tu pareja para ver el historial.
          </div>
        )}
      </div>
    </main>
  );
}
