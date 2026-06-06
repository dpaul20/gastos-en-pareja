"use client";

import { useState, useTransition } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { formatARS } from "@/lib/utils";
import {
  toggleFixedExpenseInstance,
  updateFixedExpenseInstanceAmount,
} from "@/lib/actions/expenses";
import { effectiveFixedAmount } from "@/lib/utils/balance";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type FixedExpenseInstance = MonthlyData["fixedExpenseInstances"][number];

export function FijoItem({
  fi,
  isLast,
}: {
  readonly fi: FixedExpenseInstance;
  readonly isLast: boolean;
}) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [mutationError, setMutationError] = useState<string | null>(null);

  const hasOverride = fi.amount_override != null;
  const templateAmount = fi.fixed_expense_templates.amount;
  const activeAmount = effectiveFixedAmount(fi);

  const amountMutation = useMutation({
    mutationFn: ({
      instanceId,
      amount,
    }: {
      instanceId: string;
      amount: number | null;
    }) => updateFixedExpenseInstanceAmount(instanceId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
      setEditing(false);
      setMutationError(null);
    },
    onError: (err: Error) => {
      setMutationError(err.message ?? "No se pudo actualizar el monto");
    },
  });

  function handleSave() {
    const parsed = parseFloat(draft.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMutationError("El monto debe ser mayor a cero");
      return;
    }
    setMutationError(null);
    amountMutation.mutate({ instanceId: fi.id, amount: parsed });
  }

  function handleReset() {
    amountMutation.mutate({ instanceId: fi.id, amount: null });
  }

  function handleStartEdit() {
    setDraft(String(activeAmount));
    setEditing(true);
    setMutationError(null);
  }

  function handleCancel() {
    setEditing(false);
    setMutationError(null);
  }

  return (
    <div
      style={{
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
      }}
    >
      {/* Left: description + meta */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {fi.fixed_expense_templates.description}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--fg-3)",
            marginTop: 1,
            fontFamily: "var(--font-sans)",
          }}
        >
          Vence día {fi.fixed_expense_templates.due_day}
        </div>
        {hasOverride && (
          <span
            style={{
              display: "inline-block",
              marginTop: 3,
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              color: "var(--accent)",
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 4,
              padding: "1px 5px",
              fontFamily: "var(--font-sans)",
            }}
          >
            editado
          </span>
        )}
      </div>

      {/* Center: amount display or inline edit */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {editing ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="number"
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                style={{
                  width: 110,
                  padding: "4px 8px",
                  border: "1.5px solid var(--accent)",
                  borderRadius: 8,
                  background: "var(--bg-sunken)",
                  color: "var(--fg-1)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  outline: "none",
                }}
              />
              <button
                onClick={handleSave}
                disabled={amountMutation.isPending}
                title="Guardar"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  cursor: amountMutation.isPending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                  opacity: amountMutation.isPending ? 0.6 : 1,
                }}
              >
                ✓
              </button>
              <button
                onClick={handleCancel}
                title="Cancelar"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-sunken)",
                  color: "var(--fg-2)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
            {mutationError && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--status-danger)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {mutationError}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 2,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {hasOverride && (
                <button
                  onClick={handleReset}
                  disabled={amountMutation.isPending}
                  title={`Restablecer (${formatARS(templateAmount)})`}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: amountMutation.isPending
                      ? "not-allowed"
                      : "pointer",
                    color: "var(--fg-3)",
                    fontSize: 14,
                    padding: "2px 4px",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    opacity: amountMutation.isPending ? 0.5 : 1,
                  }}
                >
                  ↻
                </button>
              )}
              <button
                onClick={handleStartEdit}
                title="Editar monto"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 4px",
                  minWidth: 44,
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--fg-1)",
                  }}
                >
                  {formatARS(activeAmount)}
                </span>
              </button>
            </div>
            {hasOverride && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-mono)",
                  textDecoration: "line-through",
                }}
              >
                {formatARS(templateAmount)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: paid toggle */}
      <button
        onClick={() =>
          startTransition(async () => {
            await toggleFixedExpenseInstance(fi.id, !fi.paid);
            queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
          })
        }
        disabled={editing || amountMutation.isPending}
        style={{
          width: 28,
          height: 28,
          borderRadius: 99,
          cursor:
            editing || amountMutation.isPending ? "not-allowed" : "pointer",
          background: fi.paid
            ? "var(--status-success-subtle)"
            : "var(--bg-sunken)",
          border: `2px solid ${fi.paid ? "var(--status-success)" : "var(--border-default)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          opacity: editing || amountMutation.isPending ? 0.5 : 1,
        }}
      >
        {fi.paid && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--status-success)"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    </div>
  );
}
