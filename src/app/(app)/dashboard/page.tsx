"use client";

import { useState } from "react";
import Link from "next/link";
import { addMonths, subMonths } from "date-fns";
import { Avatar } from "@/components/shared/avatar";
import { MonthHeader } from "@/components/shared/month-header";
import { formatARS, formatMonth, getMonthDate } from "@/lib/utils";
import {
  useCoupleMember,
  useMonthlyData,
} from "@/lib/queries/use-monthly-data";
import { calculateMonthlyBalance } from "@/lib/utils/balance";
import { ensureFixedExpenseInstances } from "@/lib/actions/expenses";

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = getMonthDate(currentDate);
  const isCurrentMonth = month === getMonthDate();

  const { data: member, isLoading: loadingMember } = useCoupleMember();
  const coupleId = member?.couple_id ?? null;

  const { data, isLoading: loadingData } = useMonthlyData(coupleId, month);

  // Ensure fixed expense instances exist for this month
  if (coupleId && isCurrentMonth) {
    ensureFixedExpenseInstances(coupleId, month);
  }

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

  const isLoading = loadingMember || loadingData;

  // Find display names from member data
  const currentUserId = member?.user_id;
  const myBalance = balance?.balances.find((b) => b.userId === currentUserId);
  const partnerBalance = balance?.balances.find(
    (b) => b.userId !== currentUserId,
  );

  // Determine initials (placeholder — real names come from auth.users)
  const myInitials = "DE";
  const partnerInitials = "AN";

  if (!member || member.couples?.status !== "ACTIVE") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100%",
          padding: "32px 24px",
          gap: 16,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40 }}>👋</div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {!member ? "Creá tu pareja" : "Invitación pendiente"}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--fg-2)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {!member
            ? "Para empezar, configurá tu pareja desde Configuración."
            : "Tu pareja todavía no aceptó la invitación."}
        </div>
        <Link
          href="/settings"
          style={{
            background: "var(--accent)",
            color: "white",
            borderRadius: 12,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            fontFamily: "var(--font-sans)",
          }}
        >
          Ir a Configuración
        </Link>
      </div>
    );
  }

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
        month={formatMonth(month)}
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
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 0",
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "var(--fg-3)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Cargando...
            </div>
          </div>
        ) : (
          <>
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
                  Balance {formatMonth(month)}
                </div>
                {balance && balance.debtAmount > 0 ? (
                  <>
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
                      {formatARS(balance.debtAmount)}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--fg-2)",
                        marginTop: 5,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {balance.debtor === currentUserId ? "Debés" : "Te deben"}
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 38,
                        fontWeight: 700,
                        color: "var(--status-success)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                      }}
                    >
                      $0
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--fg-2)",
                        marginTop: 5,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {data?.incomes.length === 0
                        ? "Registrá los ingresos en Configuración"
                        : "Todo equilibrado"}
                    </div>
                  </>
                )}
              </div>

              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {[
                    {
                      initials: myInitials,
                      person: "a" as const,
                      pct: myBalance
                        ? Math.round(myBalance.percentage * 100)
                        : 0,
                      amt: myBalance?.obligation ?? 0,
                      color: "var(--person-a)",
                      bg: "var(--person-a-subtle)",
                    },
                    {
                      initials: partnerInitials,
                      person: "b" as const,
                      pct: partnerBalance
                        ? Math.round(partnerBalance.percentage * 100)
                        : 0,
                      amt: partnerBalance?.obligation ?? 0,
                      color: "var(--person-b)",
                      bg: "var(--person-b-subtle)",
                    },
                  ].map((p) => (
                    <div
                      key={p.person}
                      style={{
                        flex: 1,
                        background: p.bg,
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
                        <Avatar
                          initials={p.initials}
                          person={p.person}
                          size="sm"
                        />
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: p.color,
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          {p.initials} · {p.pct}%
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 18,
                          fontWeight: 700,
                          color: p.color,
                        }}
                      >
                        {formatARS(p.amt)}
                      </div>
                    </div>
                  ))}
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
                      width: `${myBalance ? Math.round(myBalance.percentage * 100) : 50}%`,
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
                  amt: balance?.installmentTotal ?? 0,
                  color: "var(--person-a)",
                },
                {
                  label: "Gastos fijos",
                  amt: balance?.fixedTotal ?? 0,
                  color: "var(--person-b)",
                },
                {
                  label: "Variables",
                  amt: balance?.variableTotal ?? 0,
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
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
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
                  {formatARS(balance?.totalExpenses ?? 0)}
                </span>
              </div>
            </div>

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
              <span style={{ fontSize: 20, fontWeight: 300 }}>+</span> Agregar
              gasto
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
