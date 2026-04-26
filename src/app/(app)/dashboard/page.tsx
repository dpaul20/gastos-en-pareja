"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/shared/avatar";
import { MonthHeader } from "@/components/shared/month-header";
import { formatARS, formatMonth, getMonthDate } from "@/lib/utils";
import { addMonths, subMonths } from "date-fns";

// TODO: replace with real data from TanStack Query (issue #4)
const mockData = {
  total: 110608,
  deivyPct: 65,
  anniePct: 35,
  deivyAmt: 71895,
  annieAmt: 38713,
  balance: 31182,
  debtor: "Annie",
  creditor: "Deivy",
  cuotas: 45200,
  fijos: 40800,
  variables: 24608,
};

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = formatMonth(getMonthDate(currentDate));
  const isCurrentMonth = getMonthDate(currentDate) === getMonthDate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--bg-base)",
      }}
    >
      <MonthHeader
        month={month}
        onPrev={() => setCurrentDate((d) => subMonths(d, 1))}
        onNext={() => setCurrentDate((d) => addMonths(d, 1))}
        canGoNext={!isCurrentMonth}
      />

      <div
        style={{
          flex: 1,
          padding: "16px 16px 0",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Balance Card */}
        <div
          style={{
            background: "var(--bg-elevated)",
            borderRadius: 20,
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(108,92,231,0.07) 0%, rgba(108,92,231,0.02) 100%)",
              padding: "20px 20px 16px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--accent)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
                fontFamily: "var(--font-sans)",
              }}
            >
              Balance {month}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 38,
                fontWeight: 700,
                color: "var(--status-danger)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {formatARS(mockData.balance)}
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--fg-2)",
                marginTop: 5,
                fontFamily: "var(--font-sans)",
              }}
            >
              {mockData.debtor} le debe a {mockData.creditor}
            </div>
          </div>

          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  flex: 1,
                  background: "var(--person-a-subtle)",
                  borderRadius: 12,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Avatar initials="DE" person="a" size="sm" />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--person-a)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    Deivy · {mockData.deivyPct}%
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--person-a)",
                  }}
                >
                  {formatARS(mockData.deivyAmt)}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "var(--person-b-subtle)",
                  borderRadius: 12,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Avatar initials="AN" person="b" size="sm" />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--person-b)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    Annie · {mockData.anniePct}%
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--person-b)",
                  }}
                >
                  {formatARS(mockData.annieAmt)}
                </div>
              </div>
            </div>
            <div
              style={{
                background: "var(--color-neutral-200)",
                borderRadius: 99,
                height: 6,
                display: "flex",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${mockData.deivyPct}%`,
                  background: "var(--person-a)",
                  transition: "width 400ms",
                }}
              />
              <div style={{ flex: 1, background: "var(--person-b)" }} />
            </div>
          </div>
        </div>

        {/* Resumen del mes */}
        <div
          style={{
            background: "var(--bg-elevated)",
            borderRadius: 16,
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden",
          }}
        >
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
          {[
            {
              label: "Cuotas activas",
              amt: mockData.cuotas,
              color: "var(--person-a)",
            },
            {
              label: "Gastos fijos",
              amt: mockData.fijos,
              color: "var(--person-b)",
            },
            {
              label: "Variables",
              amt: mockData.variables,
              color: "var(--status-warning)",
            },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom:
                  i < arr.length - 1
                    ? "1px solid var(--border-subtle)"
                    : "none",
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
              {formatARS(mockData.total)}
            </span>
          </div>
        </div>

        {/* Quick action */}
        <Link
          href="/expenses"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "var(--accent)",
            borderRadius: 14,
            padding: "15px 20px",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(108,92,231,0.35)",
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 300 }}>+</span> Agregar gasto
        </Link>
      </div>
    </div>
  );
}
