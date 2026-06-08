"use client";

import { useState, useTransition } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { PersonAvatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn, formatARS } from "@/lib/utils";
import {
  toggleFixedExpenseInstance,
  updateFixedExpenseInstanceAmount,
  confirmFixedExpenseInstance,
} from "@/lib/actions/expenses";
import { effectiveFixedAmount } from "@/lib/utils/balance";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";
import { parseAmount } from "@/lib/utils/amount";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type FixedExpenseInstance = MonthlyData["fixedExpenseInstances"][number];

export function FijoItem({
  fi,
  isLast,
  getPersonInitials,
  getPerson,
}: {
  readonly fi: FixedExpenseInstance;
  readonly isLast: boolean;
  readonly getPersonInitials?: (id: string) => string;
  readonly getPerson?: (id: string) => "a" | "b";
}) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [mutationError, setMutationError] = useState<string | null>(null);

  const hasOverride = fi.amount_override != null;
  const templateAmount = fi.fixed_expense_templates.amount;
  const activeAmount = effectiveFixedAmount(fi);
  const isPending = fi.status === "PENDING_CONFIRMATION";

  const confirmMutation = useMutation({
    mutationFn: (instanceId: string) => confirmFixedExpenseInstance(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
    },
  });

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
    const parsed = parseAmount(draft);
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
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
        {isPending && (
          <span
            style={{
              display: "inline-block",
              marginTop: 3,
              background: "var(--status-danger-subtle)",
              color: "var(--status-danger)",
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 4,
              padding: "1px 5px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Sin confirmar
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
              <Input
                type="text"
                inputMode="decimal"
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                className={cn("font-mono font-semibold")}
                style={{
                  width: 110,
                  padding: "4px 8px",
                  border: "1.5px solid var(--accent)",
                  borderRadius: 8,
                  background: "var(--bg-sunken)",
                  color: "var(--fg-1)",
                  fontSize: 13,
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={amountMutation.isPending}
                title="Guardar"
                aria-label="Guardar monto"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  flexShrink: 0,
                  opacity: amountMutation.isPending ? 0.6 : 1,
                }}
              >
                <span aria-hidden="true">✓</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                aria-label="Cancelar edición"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-sunken)",
                  color: "var(--fg-2)",
                  flexShrink: 0,
                }}
              >
                <span aria-hidden="true">×</span>
              </Button>
            </div>
            {mutationError && (
              <div
                role="alert"
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
              {fi.paid_by_user_id && getPersonInitials && getPerson && (
                <PersonAvatar
                  initials={getPersonInitials(fi.paid_by_user_id)}
                  person={getPerson(fi.paid_by_user_id)}
                  size="sm"
                />
              )}
              {hasOverride && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  disabled={amountMutation.isPending}
                  aria-label="Restablecer monto"
                  title={`Restablecer (${formatARS(templateAmount)})`}
                  style={{
                    padding: "2px 4px",
                    borderRadius: 4,
                    color: "var(--fg-3)",
                    fontSize: 14,
                    opacity: amountMutation.isPending ? 0.5 : 1,
                  }}
                >
                  <span aria-hidden="true">↻</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStartEdit}
                title="Editar monto"
                aria-label="Editar monto"
                style={{
                  padding: "0 4px",
                  minWidth: 44,
                  minHeight: 44,
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
              </Button>
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

      {/* Confirm CTA — only shown when PENDING_CONFIRMATION */}
      {isPending && (
        <Button
          variant="ghost"
          onClick={() => confirmMutation.mutate(fi.id)}
          disabled={confirmMutation.isPending}
          style={{
            height: 28,
            paddingInline: 10,
            borderRadius: 8,
            border: `1.5px solid var(--status-danger)`,
            background: "var(--status-danger-subtle)",
            color: "var(--status-danger)",
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            flexShrink: 0,
            opacity: confirmMutation.isPending ? 0.5 : 1,
          }}
        >
          Confirmar
        </Button>
      )}

      {/* Right: paid toggle */}
      <Switch
        checked={fi.paid}
        onCheckedChange={(checked) =>
          startTransition(async () => {
            await toggleFixedExpenseInstance(fi.id, checked);
            queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
          })
        }
        disabled={editing || amountMutation.isPending}
        aria-label={fi.paid ? "Marcar como no pagado" : "Marcar como pagado"}
      />
    </div>
  );
}
