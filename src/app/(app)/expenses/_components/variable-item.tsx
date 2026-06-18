"use client";

import { useState, useRef, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { PersonAvatar } from "@/components/shared/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/shared/toast/use-toast";
import { formatARS } from "@/lib/utils";
import { deleteVariableExpense } from "@/lib/actions/expenses";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type VariableExpense = MonthlyData["variableExpenses"][number];

export function VariableItem({
  v,
  coupleId,
  month,
  getPersonInitials,
  getPerson,
}: {
  readonly v: VariableExpense;
  readonly coupleId: string;
  readonly month: string;
  readonly getPersonInitials: (userId: string) => string;
  readonly getPerson: (userId: string) => "a" | "b";
}) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          variableExpenses: old.variableExpenses.filter(
            (item) => item.id !== v.id,
          ),
        };
      },
    );

    toast.danger("Gasto eliminado", {
      undo: {
        label: "Deshacer",
        onUndo: handleUndo,
      },
      duration: 5000,
    });

    deleteTimerRef.current = setTimeout(() => {
      deleteTimerRef.current = null;
      startTransition(async () => {
        await deleteVariableExpense(v.id);
        queryClient.invalidateQueries({
          queryKey: ["monthly-data", coupleId, month],
        });
      });
    }, 5000);
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-[14px_16px]">
        <PersonAvatar
          initials={getPersonInitials(v.user_id)}
          person={getPerson(v.user_id)}
          size="md"
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-1)" }}>
            {v.description}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{v.date}</span>
            {!v.is_shared && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--fg-3)",
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontFamily: "var(--font-sans)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Personal
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--fg-1)",
            }}
          >
            {formatARS(v.amount)}
          </div>
          <button
            type="button"
            aria-label="Eliminar gasto"
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
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar gasto"
        description="Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={handleDelete}
      />
    </Card>
  );
}
