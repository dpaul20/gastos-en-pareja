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
            Cargandoâ€¦
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
