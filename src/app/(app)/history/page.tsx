"use client";

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  useCoupleMember,
  monthlyDataQueryOptions,
} from "@/lib/queries/use-monthly-data";
import { getHistoryMonths } from "@/lib/queries/history";
import { MonthCard } from "./_components/month-card";
import { MonthDetail } from "./_components/month-detail";

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
    <div className="flex min-h-full flex-col [background-color:var(--bg-base)]">
      <div className="border-b [border-color:var(--border-subtle)] [background-color:var(--bg-elevated)] px-5 py-3.5">
        <h1 className="m-0 [font-family:var(--font-sans)] text-[20px] font-bold [color:var(--fg-1)]">
          Historial
        </h1>
        {isLoading && (
          <div className="mt-1 [font-family:var(--font-sans)] text-xs [color:var(--fg-3)]">
            Cargando…
          </div>
        )}
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-2 px-4 py-3">
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
          <div className="py-12 text-center [font-family:var(--font-sans)] text-sm [color:var(--fg-3)]">
            Configurá tu pareja para ver el historial.
          </div>
        )}
      </div>
    </div>
  );
}
