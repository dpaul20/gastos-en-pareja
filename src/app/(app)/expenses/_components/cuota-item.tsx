"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PersonAvatar } from "@/components/shared/avatar";
import { formatARS } from "@/lib/utils";
import {
  deleteInstallmentPurchase,
  restoreInstallmentPurchase,
  incrementPaidInstallments,
} from "@/lib/actions/expenses";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";
import { DeleteExpenseButton } from "./delete-expense-button";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type InstallmentPurchase = MonthlyData["installmentPurchases"][number];

export function CuotaItem({
  c,
  getPersonInitials,
  getPerson,
}: {
  readonly c: InstallmentPurchase;
  readonly getPersonInitials?: (id: string) => string;
  readonly getPerson?: (id: string) => "a" | "b";
}) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const isPaid = c.paid_installments >= c.installments;
  const cuota = Math.round(c.total_amount / c.installments);
  return (
    <Card>
      <CardContent className="p-[14px_16px]">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "var(--fg-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {c.description}
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>
              {c.credit_card && <span>{c.credit_card} · </span>}
              Cuota {c.paid_installments} de {c.installments}
              {c.auto_renew ? <span aria-hidden="true"> 🔄</span> : ""}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              {c.paid_by_user_id && getPersonInitials && getPerson && (
                <PersonAvatar
                  initials={getPersonInitials(c.paid_by_user_id)}
                  person={getPerson(c.paid_by_user_id)}
                  size="sm"
                />
              )}
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
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={c.installments}
          aria-valuenow={c.paid_installments}
          aria-label={`Cuota ${c.paid_installments} de ${c.installments}`}
          style={{
            background: "var(--border-default)",
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
        <div className="mt-2 flex justify-end">
          <DeleteExpenseButton
            title="¿Eliminar cuota?"
            description={`"${c.description}" se eliminará permanentemente. Esta acción no se puede deshacer.`}
            successMessage="Cuota eliminada"
            onConfirm={async () => {
              const row = await deleteInstallmentPurchase(c.id);
              return row ? () => restoreInstallmentPurchase(row) : undefined;
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
