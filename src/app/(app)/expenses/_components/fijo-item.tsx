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
      className="mt-px inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 font-sans text-[11px] [color:var(--fg-2)]"
    >
      Vence día {effectiveDueDay}
      <Pencil aria-hidden size={12} className="[color:var(--accent)]" />
    </button>
  ) : (
    <div className="mt-px font-sans text-[11px] [color:var(--fg-2)]">
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
        className={cn(
          "flex flex-col gap-2 [background-color:var(--status-pending-subtle)] px-4 py-3.5",
          isLast
            ? "border-b-0"
            : "border-b [border-color:var(--border-subtle)]",
        )}
      >
        <div className="flex items-center gap-[9px]">
          <div className="min-w-0 flex-1">
            <div
              // Mockup's own `.nm` treatment (`--fg-3`) fails AA (2.91:1)
              // against dark `--status-pending-subtle` — a real axe finding
              // from testing this exact row in dark, not present in the
              // mockup's own preview. `--fg-2` (6.23:1+) keeps the "muted"
              // intent without the regression.
              className="truncate font-sans text-sm font-medium [color:var(--fg-2)]"
            >
              {fi.fixed_expense_templates.description}
            </div>
            {dueDayNode}
            {!fi.fixed_expense_templates.is_shared && (
              <Badge
                variant="personal"
                size="sm"
                className="mt-[3px] rounded-[4px] px-[5px]"
              >
                Personal
              </Badge>
            )}
          </div>
          <button
            type="button"
            data-testid="open-load-bill"
            onClick={() => onLoadBill?.(fi.id)}
            aria-label={`Cargar factura de ${fi.fixed_expense_templates.description}`}
            className={cn(
              "flex shrink-0 items-center gap-2 border-none bg-transparent p-0",
              onLoadBill ? "cursor-pointer" : "cursor-default",
            )}
          >
            <span className="font-sans text-xs font-medium [color:var(--status-pending)]">
              sin monto
            </span>
            <Badge variant="sin-factura" className="text-[10px] font-bold">
              sin factura
            </Badge>
          </button>
        </div>
        {referenceAmount != null && (
          <div className="flex items-center gap-[5px] border-t border-dashed [border-color:color-mix(in_srgb,var(--status-pending)_40%,transparent)] pt-[7px] font-sans text-[10.5px] [color:var(--status-pending)]">
            El mes pasado pagaste{" "}
            <b className="ds-amount text-[10.5px] font-semibold">
              {formatARS(referenceAmount)}
            </b>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        isLast ? "border-b-0" : "border-b [border-color:var(--border-subtle)]",
      )}
    >
      {/* Left: description + meta */}
      <div className="min-w-0 flex-1">
        <div className="truncate font-sans text-sm font-medium [color:var(--fg-1)]">
          {fi.fixed_expense_templates.description}
        </div>
        {dueDayNode}
        {!fi.fixed_expense_templates.is_shared && (
          <Badge
            variant="personal"
            size="sm"
            className="mt-[3px] mr-1 rounded-[4px] px-[5px]"
          >
            Personal
          </Badge>
        )}
        {hasOverride && (
          <Badge
            variant="editado"
            size="sm"
            className="mt-[3px] rounded-[4px] px-[5px]"
          >
            editado
          </Badge>
        )}
        {showNuevoPill && (
          <Badge variant="accent" className="mt-[3px] ml-1 inline-flex">
            nuevo
          </Badge>
        )}
      </div>

      {/* Center: amount display or inline edit */}
      <div className="flex items-center gap-1">
        {editing ? (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
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
                className="w-[110px] rounded-lg border-[1.5px] [border-color:var(--accent)] bg-[var(--bg-sunken)] px-2 py-1 font-mono text-[13px] font-semibold [color:var(--fg-1)]"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={amountMutation.isPending}
                title="Guardar"
                aria-label="Guardar monto"
                className={cn(
                  "size-7 shrink-0 rounded-lg bg-[var(--accent)] [color:var(--accent-foreground)]",
                  amountMutation.isPending ? "opacity-60" : "opacity-100",
                )}
              >
                <Check aria-hidden size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                aria-label="Cancelar edición"
                className="size-7 shrink-0 rounded-lg border [border-color:var(--border-subtle)] bg-[var(--bg-sunken)] [color:var(--fg-2)]"
              >
                <X aria-hidden size={16} />
              </Button>
            </div>
            {mutationError && (
              <div
                role="alert"
                className="font-sans text-[11px] [color:var(--status-danger-text)]"
              >
                {mutationError}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1">
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
                  className={cn(
                    "rounded px-1 py-0.5 text-sm [color:var(--fg-3)]",
                    amountMutation.isPending ? "opacity-50" : "opacity-100",
                  )}
                >
                  <RotateCcw aria-hidden size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={handleStartEdit}
                title="Editar monto"
                aria-label="Editar monto"
                className="h-8 justify-end px-2 py-0"
              >
                <span className="ds-amount text-sm font-semibold [color:var(--fg-1)]">
                  {formatARS(activeAmount)}
                </span>
              </Button>
            </div>
            {hasOverride && (
              <span className="ds-amount text-[11px] [color:var(--fg-3)] line-through">
                {formatARS(templateAmount)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: paid toggle with visible status label */}
      <div className="flex shrink-0 flex-col items-center gap-[3px]">
        <span
          className={cn(
            "font-sans text-[10px] font-semibold",
            fi.paid
              ? "[color:var(--status-success-text)]"
              : "[color:var(--fg-3)]",
          )}
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

      {!editing && (
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
