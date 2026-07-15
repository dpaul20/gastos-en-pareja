"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Minus, Pencil, Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PersonAvatar } from "@/components/shared/avatar";
import { formatARS } from "@/lib/utils";
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

const stepperButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  padding: 0,
  border: "1px solid var(--border-default)",
  borderRadius: 6,
  background: "var(--bg-elevated)",
  color: "var(--fg-2)",
  cursor: "pointer",
};

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
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          background: "none",
          border: "none",
          padding: 0,
          marginTop: 2,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 500,
          color: "var(--fg-3)",
          fontFamily: "var(--font-sans)",
        }}
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
    <div
      style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}
    >
      <button
        type="button"
        aria-label="Restar"
        onClick={() => clamp(draft - 1)}
        style={stepperButtonStyle}
      >
        <Minus size={12} aria-hidden="true" />
      </button>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--fg-1)",
          minWidth: 14,
          textAlign: "center",
        }}
      >
        {draft}
      </span>
      <button
        type="button"
        aria-label="Sumar"
        onClick={() => clamp(draft + 1)}
        style={stepperButtonStyle}
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
        style={{ ...stepperButtonStyle, color: "var(--accent)" }}
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
            <div
              className="flex flex-wrap items-center gap-1.5"
              style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3 }}
            >
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
                  style={{ display: "inline", verticalAlign: "-2px" }}
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
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={c.installments}
          aria-valuenow={displayNumber}
          aria-label={`Cuota ${displayNumber} de ${c.installments}`}
          style={{
            background: "var(--border-default)",
            borderRadius: 99,
            height: 5,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(displayNumber / c.installments) * 100}%`,
              height: "100%",
              background: isPaid ? "var(--status-success)" : "var(--accent)",
              borderRadius: 99,
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-end gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(c.id)}
              aria-label="Editar cuota"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                color: "var(--fg-3)",
                fontSize: 12,
                fontFamily: "var(--font-sans)",
                flexShrink: 0,
              }}
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
