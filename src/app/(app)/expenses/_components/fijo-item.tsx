"use client";

import { useState, useTransition } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Check, Pencil, RotateCcw, X } from "lucide-react";
import { PersonAvatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn, formatARS } from "@/lib/utils";
import {
  toggleFixedExpenseInstance,
  updateFixedExpenseInstanceAmount,
  confirmFixedExpenseInstance,
  deactivateFixedExpenseTemplate,
  reactivateFixedExpenseTemplate,
} from "@/lib/actions/expenses";
import { isBilled, billedFixedAmount } from "@/lib/utils/balance";
import { shouldShowNuevoPill } from "@/lib/utils/nuevo-pill";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";
import { parseAmount } from "@/lib/utils/amount";
import { clampDueDay } from "@/lib/utils/due-dates";
import { DeleteExpenseButton } from "./delete-expense-button";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type FixedExpenseInstance = MonthlyData["fixedExpenseInstances"][number];

export function FijoItem({
  fi,
  isLast,
  getPersonInitials,
  getPerson,
  onEditDueDay,
  onLoadBill,
  referenceAmount = null,
}: {
  readonly fi: FixedExpenseInstance;
  readonly isLast: boolean;
  readonly getPersonInitials?: (id: string) => string;
  readonly getPerson?: (id: string) => "a" | "b";
  readonly onEditDueDay?: (instanceId: string) => void;
  /** Opens the "Cargar factura" sheet for this instance — only relevant
   * while `status === "AWAITING_BILL"`. */
  readonly onLoadBill?: (instanceId: string) => void;
  /** "El mes pasado pagaste $X" — resolved by the caller via
   * `useLastBilledAmounts` + `resolveReferenceAmount`, `null` when there is
   * no honest fact to report (brand-new service or the previous month was
   * itself AWAITING_BILL). Only rendered while `status === "AWAITING_BILL"`. */
  readonly referenceAmount?: number | null;
}) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [mutationError, setMutationError] = useState<string | null>(null);

  const hasOverride = fi.amount_override != null;
  const templateAmount = fi.fixed_expense_templates.amount;
  const activeAmount = isBilled(fi) ? billedFixedAmount(fi) : 0;
  const isPending = fi.status === "PENDING_CONFIRMATION";
  // "sin factura" — no known amount yet, excluded from every total (D2).
  // Renders as its own row treatment below, not the normal amount/switch
  // layout: nothing here is safe to edit inline until a bill is loaded.
  const isAwaitingBill = fi.status === "AWAITING_BILL";
  // Gates on status === "CONFIRMED" independently of billed_at's presence
  // (see nuevo-pill.ts) — a reverted instance must never re-light this.
  const showNuevoPill = shouldShowNuevoPill(fi);
  // Same clamp rule as the dashboard's getUpcomingDues, keyed on this
  // instance's own month, so both surfaces render the identical due day.
  const [instanceYear, instanceMonth] = fi.month.split("-").map(Number);
  const monthReferenceDate = new Date(instanceYear, instanceMonth - 1, 1);
  const rawDueDay = fi.due_day ?? fi.fixed_expense_templates.due_day;
  const effectiveDueDay = clampDueDay(rawDueDay, monthReferenceDate);

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

  // `--fg-3` at this size failed AA in dark (2.91:1 against
  // `--status-pending-subtle`, a real axe finding from testing the new
  // AWAITING_BILL row) — `--fg-2` fixes it for both branches that reuse
  // this node (normal row and awaiting row alike).
  const dueDayNode = onEditDueDay ? (
    <button
      type="button"
      onClick={() => onEditDueDay(fi.id)}
      aria-label="Editar día de vencimiento"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        marginTop: 1,
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: 11,
        color: "var(--fg-2)",
        fontFamily: "var(--font-sans)",
      }}
    >
      Vence día {effectiveDueDay}
      <Pencil aria-hidden size={12} style={{ color: "var(--accent)" }} />
    </button>
  ) : (
    <div
      style={{
        fontSize: 11,
        color: "var(--fg-2)",
        marginTop: 1,
        fontFamily: "var(--font-sans)",
      }}
    >
      Vence día {effectiveDueDay}
    </div>
  );

  // "sin factura" row — a structurally different layout (column, not the
  // normal amount/switch row): no amount to show or edit, a dashed pill,
  // and an optional reference line below a dashed separator (D4).
  if (isAwaitingBill) {
    return (
      <div
        data-testid="fijo-item-awaiting"
        style={{
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
          background: "var(--status-pending-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                // Mockup's own `.nm` treatment (`--fg-3`) fails AA (2.91:1)
                // against dark `--status-pending-subtle` — a real axe finding
                // from testing this exact row in dark, not present in the
                // mockup's own preview. `--fg-2` (6.23:1+) keeps the "muted"
                // intent without the regression.
                color: "var(--fg-2)",
                fontFamily: "var(--font-sans)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fi.fixed_expense_templates.description}
            </div>
            {dueDayNode}
            {!fi.fixed_expense_templates.is_shared && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: 3,
                  background: "var(--bg-sunken)",
                  color: "var(--fg-3)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: 10,
                  fontWeight: 600,
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
          <button
            type="button"
            data-testid="open-load-bill"
            onClick={() => onLoadBill?.(fi.id)}
            aria-label={`Cargar factura de ${fi.fixed_expense_templates.description}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              border: "none",
              background: "transparent",
              cursor: onLoadBill ? "pointer" : "default",
              padding: 0,
            }}
          >
            <span
              style={{
                color: "var(--status-pending)",
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
                fontSize: 12,
              }}
            >
              sin monto
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 999,
                padding: "2px 8px",
                fontSize: 10,
                fontWeight: 700,
                whiteSpace: "nowrap",
                background: "transparent",
                color: "var(--status-pending)",
                border: "1px dashed var(--status-pending)",
                fontFamily: "var(--font-sans)",
              }}
            >
              sin factura
            </span>
          </button>
        </div>
        {referenceAmount != null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 10.5,
              color: "var(--status-pending)",
              paddingTop: 7,
              borderTop:
                "1px dashed color-mix(in srgb, var(--status-pending) 40%, transparent)",
              fontFamily: "var(--font-sans)",
            }}
          >
            El mes pasado pagaste{" "}
            <b
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
              }}
            >
              {formatARS(referenceAmount)}
            </b>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
        background: isPending ? "var(--status-warning-subtle)" : undefined,
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
        {dueDayNode}
        {!fi.fixed_expense_templates.is_shared && (
          <span
            style={{
              display: "inline-block",
              marginTop: 3,
              marginRight: 4,
              background: "var(--bg-sunken)",
              color: "var(--fg-3)",
              border: "1px solid var(--border-subtle)",
              fontSize: 10,
              fontWeight: 600,
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
              color: "var(--status-danger-text)",
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
        {showNuevoPill && (
          <Badge
            variant="accent"
            style={{ display: "inline-flex", marginTop: 3, marginLeft: 4 }}
          >
            nuevo
          </Badge>
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
                <Check aria-hidden size={16} />
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
                <X aria-hidden size={16} />
              </Button>
            </div>
            {mutationError && (
              <div
                role="alert"
                style={{
                  fontSize: 11,
                  color: "var(--status-danger-text)",
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
                  <RotateCcw aria-hidden size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={handleStartEdit}
                title="Editar monto"
                aria-label="Editar monto"
                style={{
                  height: 32,
                  padding: "0 8px",
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
            border: `1.5px solid var(--status-danger-text)`,
            background: "var(--status-danger-subtle)",
            color: "var(--status-danger-text)",
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

      {/* Right: paid toggle with visible status label */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            color: fi.paid ? "var(--status-success-text)" : "var(--fg-3)",
          }}
        >
          {fi.paid ? "Pagado" : "Sin pagar"}
        </span>
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

      {!isPending && !editing && (
        <DeleteExpenseButton
          iconOnly
          title="¿Eliminar servicio?"
          description={`"${fi.fixed_expense_templates.description}" dejará de aparecer en los próximos meses. Se conserva el historial de los meses anteriores.`}
          successMessage="Servicio eliminado"
          onConfirm={async () => {
            await deactivateFixedExpenseTemplate(fi.template_id);
            return () => reactivateFixedExpenseTemplate(fi.template_id);
          }}
        />
      )}
    </div>
  );
}
