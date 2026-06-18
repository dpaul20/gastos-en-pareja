"use client";

import { useState, useRef, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PersonAvatar } from "@/components/shared/avatar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/shared/toast/use-toast";
import { formatARS } from "@/lib/utils";
import {
  incrementPaidInstallments,
  deleteInstallmentPurchase,
} from "@/lib/actions/expenses";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type InstallmentPurchase = MonthlyData["installmentPurchases"][number];

export function CuotaItem({
  c,
  coupleId,
  month,
  getPersonInitials,
  getPerson,
}: {
  readonly c: InstallmentPurchase;
  readonly coupleId: string;
  readonly month: string;
  readonly getPersonInitials?: (id: string) => string;
  readonly getPerson?: (id: string) => "a" | "b";
}) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPaid = c.paid_installments >= c.installments;
  const cuota = Math.round(c.total_amount / c.installments);

  function handleUndo() {
    if (deleteTimerRef.current !== null) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    queryClient.invalidateQueries({
      queryKey: ["monthly-data", coupleId, month],
    });
  }

  function handleDelete() {
    // Optimistically remove from cache
    queryClient.setQueryData(
      ["monthly-data", coupleId, month],
      (old: MonthlyData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          installmentPurchases: old.installmentPurchases.filter(
            (item) => item.id !== c.id,
          ),
        };
      },
    );

    toast.danger("Compra eliminada", {
      undo: {
        label: "Deshacer",
        onUndo: handleUndo,
      },
      duration: 5000,
    });

    deleteTimerRef.current = setTimeout(() => {
      deleteTimerRef.current = null;
      startTransition(async () => {
        await deleteInstallmentPurchase(c.id);
        queryClient.invalidateQueries({
          queryKey: ["monthly-data", coupleId, month],
        });
      });
    }, 5000);
  }

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
              {c.auto_renew ? <span aria-hidden="true"> 🔄</span> : ""}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
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
              <button
                type="button"
                aria-label="Eliminar cuota"
                onClick={() => setConfirmOpen(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  lineHeight: 0,
                  color: "var(--status-danger)",
                }}
              >
                <Trash2 size={16} color="var(--status-danger)" />
              </button>
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
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar compra en cuotas"
        description="Se eliminará la compra y todas sus cuotas pendientes."
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={handleDelete}
      />
    </Card>
  );
}
