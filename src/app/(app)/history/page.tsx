"use client";

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { History, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { calculateMonthlyBalance } from "@/lib/utils/balance";
import {
  useCoupleMember,
  useCoupleMemberProfiles,
  monthlyDataQueryOptions,
} from "@/lib/queries/use-monthly-data";
import { getHistoryMonths } from "@/lib/queries/history";
import { MonthCard } from "./_components/month-card";
import { MonthDetail } from "./_components/month-detail";

export default function HistoryPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: member } = useCoupleMember();
  const coupleId = member?.couple_id ?? null;
  const { data: profiles = [] } = useCoupleMemberProfiles(
    member?.user_id ?? null,
  );
  const months = getHistoryMonths();

  const queries = useQueries({
    queries: coupleId
      ? months.map((month) => monthlyDataQueryOptions(coupleId, month))
      : [],
  });

  const isLoading = queries.some((q) => q.isLoading);
  const hasHistory = queries.some(
    (q) =>
      q.data &&
      calculateMonthlyBalance({
        incomes: q.data.incomes,
        installmentPurchases: q.data.activeInstallmentPurchases,
        fixedExpenseInstances: q.data.fixedExpenseInstances,
        variableExpenses: q.data.variableExpenses,
      }).totalExpenses > 0,
  );

  if (selected && coupleId) {
    const idx = months.indexOf(selected);
    return (
      <MonthDetail
        month={selected}
        data={queries[idx]?.data ?? undefined}
        members={profiles}
        isLoading={queries[idx]?.isLoading ?? false}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="app-ambient flex min-h-full flex-col [background-color:var(--bg-base)]">
      <PageHeader
        eyebrow="Mes a mes"
        title="Historial"
        subtitle={isLoading ? "Cargando…" : undefined}
      />
      <div className="stagger mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 py-4">
        {coupleId ? (
          <>
            {months.map((month, i) => (
              <MonthCard
                key={month}
                month={month}
                data={queries[i]?.data ?? null}
                isLoading={queries[i]?.isLoading ?? false}
                onClick={() => setSelected(month)}
                hideIfEmpty
              />
            ))}
            {!isLoading && !hasHistory && (
              <EmptyState
                icon={History}
                title="Todavía no hay historia"
                description="Cuando cargues gastos, cada mes va a quedar guardado acá para repasarlo juntos."
                action={{ label: "Cargar un gasto", href: "/expenses" }}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon={Users}
            tone="neutral"
            title="Armá tu pareja primero"
            description="Configurá tu pareja para ver el historial."
            action={{ label: "Ir a Configuración", href: "/settings" }}
          />
        )}
      </div>
    </div>
  );
}
