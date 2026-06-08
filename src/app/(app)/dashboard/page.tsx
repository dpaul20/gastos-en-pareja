"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { addMonths, subMonths } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { MonthHeader } from "@/components/shared/month-header";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatMonth, getMonthDate, formatARS } from "@/lib/utils";
import {
  useCoupleMember,
  useMonthlyData,
  useCoupleMemberProfiles,
  useCategories,
} from "@/lib/queries/use-monthly-data";
import { useMyPendingInvitations } from "@/lib/queries/settings";
import {
  calculateMonthlyBalance,
  effectiveFixedAmount,
} from "@/lib/utils/balance";
import { groupByCategory } from "@/lib/utils/categories";
import { MonthSummaryCard } from "@/components/shared/month-summary-card";
import { ensureFixedExpenseInstances } from "@/lib/actions/expenses";
import { NoCoupleState } from "./_components/no-couple-state";
import { NewInstancesBanner } from "./_components/new-instances-banner";
import { PendingReviewBanner } from "./_components/pending-review-banner";
import { BalanceCard } from "./_components/balance-card";
import { CategoryBreakdownCard } from "./_components/category-breakdown-card";
import { UpcomingDuesWidget } from "./_components/upcoming-dues-widget";

// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────

type FixedInstance = Parameters<typeof effectiveFixedAmount>[0];

function MonthlyFixedSummary({
  instances,
}: {
  readonly instances: FixedInstance[];
}) {
  const total = instances.length;
  const paid = instances.filter((i) => i.paid).length;
  const paidAmount = instances
    .filter((i) => i.paid)
    .reduce((sum, i) => sum + effectiveFixedAmount(i), 0);
  const pendingAmount = instances
    .filter((i) => !i.paid)
    .reduce((sum, i) => sum + effectiveFixedAmount(i), 0);

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-2 p-3">
        <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500 }}>
          {paid} de {total} servicios pagados
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <span
            style={{
              fontSize: 12,
              color: "var(--color-teal)",
              fontWeight: 600,
            }}
          >
            {formatARS(paidAmount)}
          </span>
          {pendingAmount > 0 && (
            <span
              style={{
                fontSize: 12,
                color: "var(--color-coral)",
                fontWeight: 600,
              }}
            >
              {formatARS(pendingAmount)} pendiente
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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

  const pendingCount =
    data?.fixedExpenseInstances.filter(
      (fi) => fi.status === "PENDING_CONFIRMATION",
    ).length ?? 0;

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
    <div
      style={{ minHeight: "100%", background: "var(--bg-base)" }}
    >
      <MonthHeader
        month={formatMonth(month)}
        onPrev={() => setCurrentDate((d) => subMonths(d, 1))}
        onNext={() => setCurrentDate((d) => addMonths(d, 1))}
        canGoNext={!isCurrentMonth}
      />

      {loadingMember || loadingData ? (
        <div className="flex flex-col gap-3 p-4 lg:p-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <div className="p-4 pb-0 lg:p-6 lg:pb-0">
          <NewInstancesBanner
            count={newInstancesBanner}
            onDismiss={() => setNewInstancesBanner(0)}
          />
          <PendingReviewBanner count={pendingCount} />

          {/* Desktop: 2-col grid | Mobile: single column */}
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
            {/* Left column */}
            <div className="flex flex-col gap-3 lg:gap-4">
              {isCurrentMonth && data?.fixedExpenseInstances && coupleId && (
                <UpcomingDuesWidget
                  instances={
                    data.fixedExpenseInstances as Parameters<
                      typeof UpcomingDuesWidget
                    >[0]["instances"]
                  }
                  coupleId={coupleId}
                  month={month}
                />
              )}
              {balance && (
                <BalanceCard
                  balance={balance}
                  month={month}
                  myProfile={myProfile}
                  partnerProfile={partnerProfile}
                />
              )}
              {data?.fixedExpenseInstances &&
                data.fixedExpenseInstances.length > 0 && (
                  <MonthlyFixedSummary
                    instances={
                      data.fixedExpenseInstances as Parameters<
                        typeof effectiveFixedAmount
                      >[0][]
                    }
                  />
                )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-3 lg:gap-4">
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
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 300 }}>+</span> Agregar
                gasto
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
