"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Minus, Pencil, Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PersonAvatar } from "@/components/shared/avatar";
import { cn, formatARS } from "@/lib/utils";
import {
  deleteInstallmentPurchase,
  restoreInstallmentPurchase,
  incrementPaidInstallments,
  upsertInstallmentMonthOverride,
} from "@/lib/actions/expenses";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";
import {
  installmentNumberForMonth,
  isCardComputedInstallment,
} from "@/lib/utils/installments";
import { DeleteExpenseButton } from "./delete-expense-button";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type InstallmentPurchase = MonthlyData["installmentPurchases"][number];
type Card_ = MonthlyData["cards"][number];
type InstallmentOverride = MonthlyData["installmentMonthOverrides"][number];

// Slice 0 precedent (variable-item.tsx edit affordance): shadcn `Button`'s
// base classes bake in forced icon sizing (`size-4` unless the icon carries
// a `size-*` class) that would regress these 12px stepper icons — a plain
// Tailwind `<button>` stays the pixel-exact one-off trigger.
const stepperButtonClass =
  "inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] p-0 [color:var(--fg-2)]";

// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────

// R3-D/R3-E "Corregir número": manual per-month correction for card+
// payment_day cuotas, whose number is otherwise computed automatically. This
// is the ONLY affordance that mutates the computed number — it hides itself
// once no card is resolvable (see isCardComputedInstallment gating below).
function InstallmentNumberCorrection({
  purchaseId,
  month,
  installments,
  currentNumber,
}: Readonly<{
  purchaseId: string;
  month: string;
  installments: number;
  currentNumber: number;
}>) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(currentNumber);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(currentNumber);
          setOpen(true);
        }}
        className="mt-0.5 inline-flex cursor-pointer items-center gap-[3px] border-none bg-transparent p-0 font-sans text-[11px] font-medium [color:var(--fg-3)]"
      >
        <Pencil size={11} aria-hidden="true" />
        Corregir número
      </button>
    );
  }

  function clamp(next: number) {
    setDraft(Math.min(Math.max(next, 1), installments));
  }

  return (
    <div className="mt-0.5 flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Restar"
        onClick={() => clamp(draft - 1)}
        className={stepperButtonClass}
      >
        <Minus size={12} aria-hidden="true" />
      </button>
      <span className="min-w-[14px] text-center font-mono text-xs font-semibold [color:var(--fg-1)]">
        {draft}
      </span>
      <button
        type="button"
        aria-label="Sumar"
        onClick={() => clamp(draft + 1)}
        className={stepperButtonClass}
      >
        <Plus size={12} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Guardar número de cuota"
        onClick={() =>
          startTransition(async () => {
            await upsertInstallmentMonthOverride(purchaseId, month, draft);
            queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
            setOpen(false);
          })
        }
        className={cn(stepperButtonClass, "[color:var(--accent)]")}
      >
        <Check size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export function CuotaItem({
  c,
  cards = [],
  overrides = [],
  month,
  getPersonInitials,
  getPerson,
  onEdit,
}: {
  readonly c: InstallmentPurchase;
  readonly cards?: readonly Card_[];
  readonly overrides?: readonly InstallmentOverride[];
  readonly month?: string;
  readonly getPersonInitials?: (id: string) => string;
  readonly getPerson?: (id: string) => "a" | "b";
  readonly onEdit?: (id: string) => void;
}) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const card = c.card_id
    ? (cards.find((cd) => cd.id === c.card_id) ?? null)
    : null;
  const override = overrides.find((o) => o.purchase_id === c.id) ?? null;
  const isComputed = isCardComputedInstallment(c, card);
  // R3-F: `today` is resolved at render, never baked into query data/key.
  const today = new Date();
  // R3-E: the SINGLE SOURCE feeding every display read below (isPaid, label,
  // badge, progressbar aria-valuenow/width) — never re-derive from
  // `paid_installments` directly for a card+payment_day cuota.
  const displayNumber = month
    ? installmentNumberForMonth(c, card, month, override, today)
    : c.paid_installments;
  const isPaid = displayNumber >= c.installments;
  // Commit 6: a non-auto_renew cuota that reached its last installment is
  // DONE — distinct from "Pagado" (which auto_renew cuotas also briefly show
  // right before wrapping to installment 1). Still visible + deletable
  // (isInstallmentActiveInMonth already excludes it from totals once idx
  // passes `installments`, see design R3-B) — no decorative emoji, teal
  // "success" badge per the DS status tokens.
  const isFinished = isPaid && !c.auto_renew;
  const cuota = Math.round(c.total_amount / c.installments);
  return (
    <Card>
      <CardContent className="p-[14px_16px]">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-medium [color:var(--fg-1)]">
              {c.description}
            </div>
            <div className="mt-[3px] flex flex-wrap items-center gap-1.5 text-xs [color:var(--fg-3)]">
              {card && (
                <Badge variant="accent" data-testid="cuota-card-badge">
                  {card.name}
                </Badge>
              )}
              {!card && c.credit_card && <span>{c.credit_card} · </span>}
              <span>
                Cuota {displayNumber} de {c.installments}
              </span>
              {c.auto_renew ? (
                <RefreshCw
                  aria-label="Se renueva automáticamente"
                  size={12}
                  className="inline align-[-2px]"
                />
              ) : null}
            </div>
            {isComputed && month && (
              <InstallmentNumberCorrection
                purchaseId={c.id}
                month={month}
                installments={c.installments}
                currentNumber={displayNumber}
              />
            )}
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
              <span className="ds-amount text-[15px] font-semibold [color:var(--fg-1)]">
                {formatARS(cuota)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge
                variant={isPaid ? "success" : "warning"}
                data-testid="cuota-status-badge"
              >
                {isFinished ? "Terminada" : isPaid ? "Pagado" : "Pendiente"}
              </Badge>
              {!isPaid && !isComputed && (
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
        <Progress
          value={displayNumber}
          max={c.installments}
          aria-label={`Cuota ${displayNumber} de ${c.installments}`}
          aria-valuetext={undefined}
          className={cn(
            "h-[5px] w-full overflow-hidden rounded-full bg-[var(--border-default)]",
            isPaid
              ? "[&_[data-slot=progress-indicator]]:bg-[var(--status-success)]"
              : "[&_[data-slot=progress-indicator]]:bg-[var(--accent)]",
          )}
        />
        <div className="mt-2 flex items-center justify-end gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(c.id)}
              aria-label="Editar cuota"
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 border-none bg-transparent px-2 py-1 font-sans text-xs [color:var(--fg-3)]"
            >
              <Pencil size={14} aria-hidden="true" />
              Editar
            </button>
          )}
          <DeleteExpenseButton
            title="¿Eliminar cuota?"
            description={`"${c.description}" se eliminará. Vas a poder deshacer la acción desde el aviso.`}
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
