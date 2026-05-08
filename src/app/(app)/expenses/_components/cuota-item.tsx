"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardContent className="p-[14px_16px]">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <div
              style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-1)" }}
            >
              {c.description}
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>
              {c.credit_card && <span>{c.credit_card} · </span>}
              Cuota {c.paid_installments} de {c.installments}
              {c.auto_renew ? " 🔄" : ""}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
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
            <div className="flex items-center gap-1.5">
              <Badge variant={isPaid ? "success" : "warning"}>
                {isPaid ? "Pagado" : "Pendiente"}
              </Badge>
              {!isPaid && (
                <Button
                  size="sm"
                  className="h-auto px-2 py-0.5 text-[11px] font-semibold"
                  onClick={() =>
                    startTransition(async () => {
                      await incrementPaidInstallments(c.id);
                      queryClient.invalidateQueries({
                        queryKey: ["monthly-data"],
                      });
                    })
                  }
                >
                  +1
                </Button>
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
      </CardContent>
    </Card>
  );
}
