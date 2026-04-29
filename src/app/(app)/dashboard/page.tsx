"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { addMonths, subMonths } from "date-fns";
import { Avatar } from "@/components/shared/avatar";
import { MonthHeader } from "@/components/shared/month-header";
import { formatARS, formatMonth, getMonthDate } from "@/lib/utils";
import {
  useCoupleMember,
  useMonthlyData,
  useCoupleMemberProfiles,
  useCategories,
} from "@/lib/queries/use-monthly-data";
import {
  calculateMonthlyBalance,
  type MonthlyBalance,
} from "@/lib/utils/balance";
import { groupByCategory, type CategoryGroup } from "@/lib/utils/categories";
import { ensureFixedExpenseInstances } from "@/lib/actions/expenses";
type Profile = { user_id: string; full_name: string };

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── SUB-COMPONENTS ────────────────────────────────────────────

function NoCoupleState({ hasMember }: { hasMember: boolean }) {
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
        {hasMember ? "Invitación pendiente" : "Creá tu pareja"}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--fg-2)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {hasMember
          ? "Tu pareja todavía no aceptó la invitación."
          : "Para empezar, configurá tu pareja desde Configuración."}
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

function NewInstancesBanner({
  count,
  onDismiss,
}: {
  count: number;
  onDismiss: () => void;
}) {
  if (count === 0) return null;
  const plural = count > 1;
  return (
    <div
      style={{
        background: "var(--status-success-subtle)",
        borderRadius: 12,
        padding: "10px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: "var(--status-success)",
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
        }}
      >
        ✓ {count} gasto{plural ? "s" : ""} fijo{plural ? "s" : ""} generado
        {plural ? "s" : ""} para este mes
      </span>
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--status-success)",
          fontSize: 16,
          padding: 2,
        }}
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
}

function BalanceCard({
  balance,
  month,
  myProfile,
  partnerProfile,
}: {
  balance: MonthlyBalance;
  month: string;
  myProfile: Profile | undefined;
  partnerProfile: Profile | undefined;
}) {
  const myInitials = myProfile ? getInitials(myProfile.full_name) : "?";
  const partnerInitials = partnerProfile
    ? getInitials(partnerProfile.full_name)
    : "?";
  const myFirstName = myProfile?.full_name.split(" ")[0] ?? "Vos";
  const partnerFirstName =
    partnerProfile?.full_name.split(" ")[0] ?? "Tu pareja";
  const myPct = Math.round((balance.balances[0]?.percentage ?? 0.5) * 100);

  return (
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
        {balance.debtAmount > 0 ? (
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
              {balance.debtor === balance.balances[0]?.userId
                ? `${myFirstName} le debe a ${partnerFirstName}`
                : `${partnerFirstName} le debe a ${myFirstName}`}
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
              {balance.balances.length === 0
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
              name: myFirstName,
              pct: myPct,
              amt: balance.balances[0]?.obligation ?? 0,
              color: "var(--person-a)",
              bg: "var(--person-a-subtle)",
            },
            {
              initials: partnerInitials,
              person: "b" as const,
              name: partnerFirstName,
              pct: 100 - myPct,
              amt: balance.balances[1]?.obligation ?? 0,
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
                <Avatar initials={p.initials} person={p.person} size="sm" />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: p.color,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {p.name} · {p.pct}%
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
              width: `${myPct}%`,
              background: "var(--person-a)",
              transition: "width 400ms",
            }}
          />
          <div style={{ flex: 1, background: "var(--person-b)" }} />
        </div>
      </div>
    </div>
  );
}

function MonthSummaryCard({ balance }: { balance: MonthlyBalance }) {
  const rows = [
    {
      label: "Cuotas activas",
      amt: balance.installmentTotal,
      color: "var(--person-a)",
    },
    {
      label: "Gastos fijos",
      amt: balance.fixedTotal,
      color: "var(--person-b)",
    },
    {
      label: "Variables",
      amt: balance.variableTotal,
      color: "var(--status-warning)",
    },
  ];
  return (
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
      {rows.map((row, i) => (
        <div
          key={row.label}
          style={{
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom:
              i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none",
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
          {formatARS(balance.totalExpenses)}
        </span>
      </div>
    </div>
  );
}

function CategoryBreakdownCard({
  breakdown,
  total,
}: {
  breakdown: CategoryGroup[];
  total: number;
}) {
  if (breakdown.length === 0) return null;
  return (
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
          Por categoría
        </div>
      </div>
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {breakdown.map((g) => {
          const pct = total > 0 ? Math.round((g.total / total) * 100) : 0;
          const color = g.category?.color ?? "#B2BEC3";
          const label = g.category
            ? `${g.category.icon} ${g.category.name}`
            : "📦 Sin categorizar";
          return (
            <div key={g.category?.id ?? "uncategorized"}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--fg-2)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--fg-1)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatARS(g.total)}
                </span>
              </div>
              <div
                style={{
                  background: "var(--bg-sunken)",
                  borderRadius: 99,
                  height: 5,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: color,
                    borderRadius: 99,
                    transition: "width 400ms",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newInstancesBanner, setNewInstancesBanner] = useState(0);
  const month = getMonthDate(currentDate);
  const isCurrentMonth = month === getMonthDate();

  const { data: member, isLoading: loadingMember } = useCoupleMember();
  const coupleId = member?.couple_id ?? null;
  const { data, isLoading: loadingData } = useMonthlyData(coupleId, month);
  const { data: profiles = [] } = useCoupleMemberProfiles(
    member?.user_id ?? null,
  );
  const { data: categories = [] } = useCategories(coupleId);

  useEffect(() => {
    if (!coupleId) return;
    ensureFixedExpenseInstances(coupleId, month).then(({ created }) => {
      if (created > 0) setNewInstancesBanner(created);
    });
  }, [coupleId, month]);

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

  const categoryBreakdown =
    data && balance && balance.totalExpenses > 0
      ? groupByCategory(
          [
            ...data.installmentPurchases.map((p) => ({
              amount: Math.round(p.total_amount / p.installments),
              category_id: p.category_id,
            })),
            ...data.fixedExpenseInstances.map((fi) => ({
              amount: fi.fixed_expense_templates.amount,
              category_id: fi.fixed_expense_templates.category_id,
            })),
            ...data.variableExpenses.map((v) => ({
              amount: v.amount,
              category_id: v.category_id,
            })),
          ],
          categories,
        ).slice(0, 5)
      : [];

  const currentUserId = member?.user_id;
  const myProfile = profiles.find((p) => p.user_id === currentUserId);
  const partnerProfile = profiles.find((p) => p.user_id !== currentUserId);

  if (!member || member.couples?.status !== "ACTIVE") {
    return <NoCoupleState hasMember={!!member} />;
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
        {loadingMember || loadingData ? (
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
            <NewInstancesBanner
              count={newInstancesBanner}
              onDismiss={() => setNewInstancesBanner(0)}
            />
            {balance && (
              <BalanceCard
                balance={balance}
                month={month}
                myProfile={myProfile}
                partnerProfile={partnerProfile}
              />
            )}
            {balance && <MonthSummaryCard balance={balance} />}
            <CategoryBreakdownCard
              breakdown={categoryBreakdown}
              total={balance?.totalExpenses ?? 0}
            />
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
