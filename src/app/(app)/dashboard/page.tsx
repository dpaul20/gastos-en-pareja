"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { addMonths, subMonths } from "date-fns";
import { Avatar } from "@/components/shared/avatar";
import { MonthHeader } from "@/components/shared/month-header";
import { formatARS, formatMonth, getMonthDate, getInitials } from "@/lib/utils";
import {
  useCoupleMember,
  useMonthlyData,
  useCoupleMemberProfiles,
  useCategories,
} from "@/lib/queries/use-monthly-data";
import { useMyPendingInvitations } from "@/lib/queries/settings";
import {
  calculateMonthlyBalance,
  type MonthlyBalance,
} from "@/lib/utils/balance";
import { groupByCategory, type CategoryGroup } from "@/lib/utils/categories";
import { MonthSummaryCard } from "@/components/shared/month-summary-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ensureFixedExpenseInstances } from "@/lib/actions/expenses";
type Profile = { user_id: string; full_name: string };

// ── SUB-COMPONENTS ────────────────────────────────────────────

function NoCoupleState({
  hasMember,
  hasPendingInvitation,
}: {
  readonly hasMember: boolean;
  readonly hasPendingInvitation: boolean;
}) {
  const showPendingState = hasMember || hasPendingInvitation;

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
        {showPendingState ? "Invitación pendiente" : "Creá tu pareja"}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--fg-2)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {showPendingState
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
  readonly count: number;
  readonly onDismiss: () => void;
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
  readonly balance: MonthlyBalance;
  readonly month: string;
  readonly myProfile: Profile | undefined;
  readonly partnerProfile: Profile | undefined;
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
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 4,
            fontFamily: "var(--font-sans)",
            margin: 0,
          }}
        >
          Balance {formatMonth(month)}
        </h2>
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

interface CategoryBarShapeProps {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly color?: string;
}

function CategoryBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  color = "#B2BEC3",
}: CategoryBarShapeProps) {
  return (
    <rect
      x={x}
      y={y}
      width={Math.max(0, width)}
      height={height}
      fill={color}
      rx={4}
    />
  );
}

interface CategoryTooltipProps {
  readonly active?: boolean;
  readonly payload?: Array<{ value: number }>;
}

function CategoryTooltip({ active, payload }: CategoryTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 13,
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        color: "var(--fg-1)",
      }}
    >
      {formatARS(payload[0].value)}
    </div>
  );
}

function CategoryBreakdownCard({
  breakdown,
}: {
  readonly breakdown: CategoryGroup[];
}) {
  if (breakdown.length === 0) return null;

  const chartData = breakdown.map((g) => ({
    name: g.category ? `${g.category.icon} ${g.category.name}` : "📦 Sin cat.",
    total: g.total,
    color: g.category?.color ?? "#B2BEC3",
  }));

  const rowHeight = 36;
  const chartHeight = breakdown.length * rowHeight + 16;

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
      <div style={{ padding: "12px 8px 12px 0" }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
          >
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{
                fontSize: 12,
                fill: "var(--fg-2)",
                fontFamily: "var(--font-sans)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--bg-sunken)", opacity: 0.5 }}
              content={<CategoryTooltip />}
            />
            <Bar
              dataKey="total"
              radius={[0, 6, 6, 0]}
              maxBarSize={20}
              shape={<CategoryBarShape />}
            />
          </BarChart>
        </ResponsiveContainer>
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
  const { data: myPendingInvitations = [] } = useMyPendingInvitations();
  const coupleId = member?.couple_id ?? null;
  const { data, isLoading: loadingData } = useMonthlyData(coupleId, month);
  const { data: profiles = [] } = useCoupleMemberProfiles(
    member?.user_id ?? null,
  );
  const { data: categories = [] } = useCategories(coupleId);

  const { mutate: ensureInstances } = useMutation({
    mutationFn: (vars: { coupleId: string; month: string }) =>
      ensureFixedExpenseInstances(vars.coupleId, vars.month),
    onSuccess: ({ created }) => {
      if (created > 0) setNewInstancesBanner(created);
    },
  });

  useEffect(() => {
    if (coupleId) ensureInstances({ coupleId, month });
    // ensureInstances is stable (useMutation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, month]);

  const balance = useMemo(
    () =>
      data
        ? calculateMonthlyBalance({
            incomes: data.incomes,
            installmentPurchases: data.installmentPurchases,
            fixedExpenseInstances: data.fixedExpenseInstances as Parameters<
              typeof calculateMonthlyBalance
            >[0]["fixedExpenseInstances"],
            variableExpenses: data.variableExpenses,
          })
        : null,
    [data],
  );

  const categoryBreakdown = useMemo(() => {
    if (!data || !balance || balance.totalExpenses === 0) return [];
    return groupByCategory(
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
    ).slice(0, 5);
  }, [data, balance, categories]);

  const currentUserId = member?.user_id;
  const myProfile = profiles.find((p) => p.user_id === currentUserId);
  const partnerProfile = profiles.find((p) => p.user_id !== currentUserId);

  if (loadingMember) {
    return null;
  }

  if (!member || member.couples?.status !== "ACTIVE") {
    return (
      <NoCoupleState
        hasMember={!!member}
        hasPendingInvitation={myPendingInvitations.length > 0}
      />
    );
  }

  return (
    <main
      aria-label="Inicio"
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
            <CategoryBreakdownCard breakdown={categoryBreakdown} />
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
    </main>
  );
}
