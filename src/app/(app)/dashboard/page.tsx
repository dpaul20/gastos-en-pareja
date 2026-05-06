"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { addMonths, subMonths } from "date-fns";
import { MonthHeader } from "@/components/shared/month-header";
import Link from "next/link";
import { formatMonth, getMonthDate } from "@/lib/utils";
import {
  useCoupleMember,
  useMonthlyData,
  useCoupleMemberProfiles,
  useCategories,
} from "@/lib/queries/use-monthly-data";
import { useMyPendingInvitations } from "@/lib/queries/settings";
import { calculateMonthlyBalance } from "@/lib/utils/balance";
import { groupByCategory } from "@/lib/utils/categories";
import { MonthSummaryCard } from "@/components/shared/month-summary-card";
import { ensureFixedExpenseInstances } from "@/lib/actions/expenses";
import { NoCoupleState } from "./_components/no-couple-state";
import { NewInstancesBanner } from "./_components/new-instances-banner";
import { BalanceCard } from "./_components/balance-card";
import { CategoryBreakdownCard } from "./_components/category-breakdown-card";

// ── PAGE ──────────────────────────────────────────────────────────────────────

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
