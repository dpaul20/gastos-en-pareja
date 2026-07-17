"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  isBilled,
  billedFixedAmount,
} from "@/lib/utils/balance";
import { summarizeSettlements } from "@/lib/utils/settlement";
import type { Database } from "@/types/database";
import { groupByCategory } from "@/lib/utils/categories";
import { buildMonthSummaryLines } from "@/lib/utils/summary-lines";
import { MonthSummaryCard } from "@/components/shared/month-summary-card";
import {
  ensureFixedExpenseInstances,
  ensureIncomeCarriedForward,
} from "@/lib/actions/expenses";
import { NoCoupleState } from "./_components/no-couple-state";
import { NewInstancesBanner } from "./_components/new-instances-banner";
import { BalanceCard } from "./_components/balance-card";
import { SettleSheet } from "./_components/settle-sheet";
import { CategoryBreakdownCard } from "./_components/category-breakdown-card";
import { UpcomingDuesWidget } from "./_components/upcoming-dues-widget";

// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────

type FixedInstance = Parameters<typeof isBilled>[0];
type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"];

function MonthlyFixedSummary({
  instances,
}: {
  readonly instances: FixedInstance[];
}) {
  const total = instances.length;
  const paid = instances.filter((i) => i.paid).length;
  // AWAITING_BILL ("sin factura") instances have no known amount yet — they
  // contribute $0 here until PR2/PR3 wire the dedicated "sin factura" UI.
  const paidAmount = instances
    .filter((i) => i.paid)
    .reduce((sum, i) => (isBilled(i) ? sum + billedFixedAmount(i) : sum), 0);
  const pendingAmount = instances
    .filter((i) => !i.paid)
    .reduce((sum, i) => (isBilled(i) ? sum + billedFixedAmount(i) : sum), 0);

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
              color: "var(--status-success-text)",
              fontWeight: 600,
            }}
          >
            {formatARS(paidAmount)}
          </span>
          {pendingAmount > 0 && (
            <span
              style={{
                fontSize: 12,
                color: "var(--status-danger-text)",
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

/** Parses a "YYYY-MM" URL param into the first day of that month (local). */
function monthParamToDate(param: string | null): Date {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split("-").map(Number);
    if (m >= 1 && m <= 12) return new Date(y, m - 1, 1);
  }
  return new Date();
}

function DashboardView() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState(() =>
    monthParamToDate(searchParams.get("mes")),
  );
  const [newInstancesBanner, setNewInstancesBanner] = useState(0);
  const [settleOpen, setSettleOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] =
    useState<SettlementRow | null>(null);
  const month = getMonthDate(currentDate);
  const isCurrentMonth = month === getMonthDate();

  // Sync the selected month to the URL (?mes=YYYY-MM). Current month = clean URL.
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (isCurrentMonth) {
      params.delete("mes");
    } else {
      params.set(
        "mes",
        `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`,
      );
    }
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL sync keys on the selected month; router/searchParams/pathname are stable and excluded to avoid loops
  }, [currentDate, isCurrentMonth]);

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

  const { mutate: ensureIncomeCarry } = useMutation({
    mutationFn: (vars: { coupleId: string; month: string }) =>
      ensureIncomeCarriedForward(vars.coupleId, vars.month),
    onSuccess: ({ created }) => {
      if (created > 0) {
        queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
        queryClient.invalidateQueries({ queryKey: ["income-with-carry"] });
      }
    },
  });

  useEffect(() => {
    // Bug 1: viewing a past/future month must never write rows — instance
    // creation is limited to the real current calendar month.
    if (!isCurrentMonth) return;
    if (coupleId) ensureInstances({ coupleId, month });
    // ensureInstances is stable (useMutation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, month, isCurrentMonth]);

  useEffect(() => {
    // Same guard as above: carrying income forward is a current-month-only
    // side effect, never triggered by browsing to another month.
    if (!isCurrentMonth) return;
    if (coupleId) ensureIncomeCarry({ coupleId, month });
    // ensureIncomeCarry is stable (useMutation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, month, isCurrentMonth]);

  const balance = useMemo(
    () =>
      data
        ? calculateMonthlyBalance({
            incomes: data.incomes,
            installmentPurchases: data.activeInstallmentPurchases,
            fixedExpenseInstances: data.fixedExpenseInstances as Parameters<
              typeof calculateMonthlyBalance
            >[0]["fixedExpenseInstances"],
            variableExpenses: data.variableExpenses,
          })
        : null,
    [data],
  );

  // Settlements layered on top of the balance (PR6). Never feeds back into
  // calculateMonthlyBalance — it only reports the debt that remains after
  // recorded payments (design D3, structural invariant).
  const settlementSummary = useMemo(
    () =>
      balance && data
        ? summarizeSettlements({
            debtor: balance.debtor,
            creditor: balance.creditor,
            debtAmount: balance.debtAmount,
            settlements: data.settlements,
          })
        : null,
    [balance, data],
  );

  const awaitingBillCount = useMemo(
    () =>
      data?.fixedExpenseInstances.filter((i) => i.status === "AWAITING_BILL")
        .length ?? 0,
    [data],
  );

  const summaryLines = useMemo(
    () =>
      data
        ? buildMonthSummaryLines({
            incomes: data.incomes,
            installmentPurchases: data.activeInstallmentPurchases,
            fixedExpenseInstances: data.fixedExpenseInstances as Parameters<
              typeof buildMonthSummaryLines
            >[0]["fixedExpenseInstances"],
            variableExpenses: data.variableExpenses,
          })
        : undefined,
    [data],
  );

  const categoryBreakdown = useMemo(() => {
    if (!data || !balance || balance.totalExpenses === 0) return [];
    return groupByCategory(
      [
        // Mirror balance.ts's installmentTotal count gate so the breakdown
        // reconciles exactly (a fully-paid non-renewing purchase still
        // schedule-active in the month is excluded from both).
        ...data.activeInstallmentPurchases
          .filter((p) => p.auto_renew || p.paid_installments < p.installments)
          .map((p) => ({
            amount: Math.round(p.total_amount / p.installments),
            category_id: p.category_id,
          })),
        ...data.fixedExpenseInstances.map((fi) => {
          const instance = fi as FixedInstance;
          return {
            amount: isBilled(instance) ? billedFixedAmount(instance) : 0,
            category_id: fi.fixed_expense_templates.category_id,
          };
        }),
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
    <div style={{ minHeight: "100%", background: "var(--bg-base)" }}>
      <h1 className="sr-only">Inicio</h1>
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
              {balance && settlementSummary && (
                <BalanceCard
                  balance={balance}
                  summary={settlementSummary}
                  awaitingBillCount={awaitingBillCount}
                  month={month}
                  myProfile={myProfile}
                  partnerProfile={partnerProfile}
                  settlements={data?.settlements ?? []}
                  onRegisterPayment={() => setSettleOpen(true)}
                  onEditSettlement={setEditingSettlement}
                />
              )}
              {data?.fixedExpenseInstances &&
                data.fixedExpenseInstances.length > 0 && (
                  <MonthlyFixedSummary
                    instances={
                      data.fixedExpenseInstances as Parameters<
                        typeof isBilled
                      >[0][]
                    }
                  />
                )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-3 lg:gap-4">
              {balance && (
                <MonthSummaryCard balance={balance} lines={summaryLines} />
              )}
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

      {coupleId &&
        settlementSummary &&
        (editingSettlement || (settleOpen && settlementSummary.direction)) && (
          <SettleSheet
            coupleId={coupleId}
            month={month}
            members={
              [myProfile, partnerProfile].filter(Boolean) as {
                user_id: string;
                full_name: string;
              }[]
            }
            defaultFromUserId={settlementSummary.direction?.debtor ?? ""}
            defaultToUserId={settlementSummary.direction?.creditor ?? ""}
            defaultAmount={settlementSummary.remainingDebt}
            editing={editingSettlement ?? undefined}
            onClose={() => {
              setSettleOpen(false);
              setEditingSettlement(null);
            }}
          />
        )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardView />
    </Suspense>
  );
}
