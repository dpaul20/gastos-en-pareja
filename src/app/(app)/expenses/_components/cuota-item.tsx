"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { formatARS } from "@/lib/utils";
import { incrementPaidInstallments } from "@/lib/actions/expenses";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type InstallmentPurchase = MonthlyData["installmentPurchases"][number];

export function CuotaItem({ c }: { readonly c: InstallmentPurchase }) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const isPaid = c.paid_installments >= c.installments;
  const cuota = Math.round(c.total_amount / c.installments);
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 14,
        padding: "14px 16px",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {c.description}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--fg-3)",
              marginTop: 2,
              fontFamily: "var(--font-sans)",
            }}
          >
            {c.credit_card && <span>{c.credit_card} · </span>}
            Cuota {c.paid_installments} de {c.installments}
            {c.auto_renew ? " 🔄" : ""}
          </div>
        </div>
        <div
          style={{
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--fg-1)",
            }}
          >
            {formatARS(cuota)}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Badge variant={isPaid ? "success" : "warning"}>
              {isPaid ? "Pagado" : "Pendiente"}
            </Badge>
            {!isPaid && (
              <button
                onClick={() =>
                  startTransition(async () => {
                    await incrementPaidInstallments(c.id);
                    queryClient.invalidateQueries({
                      queryKey: ["monthly-data"],
                    });
                  })
                }
                style={{
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: 6,
                  padding: "3px 8px",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                +1
              </button>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          background: "var(--color-neutral-200)",
          borderRadius: 99,
          height: 5,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(c.paid_installments / c.installments) * 100}%`,
            height: "100%",
            background: isPaid ? "var(--status-success)" : "var(--accent)",
            borderRadius: 99,
          }}
        />
      </div>
    </div>
  );
}
