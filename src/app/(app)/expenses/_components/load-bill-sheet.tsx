"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/shared/avatar";
import { ResponsiveModal } from "@/components/shared/responsive-modal";
import { formatARS, getInitials } from "@/lib/utils";
import { parseAmount } from "@/lib/utils/amount";
import { isValidBillAmount, MAX_BILL_AMOUNT } from "@/lib/utils/bill-amount";
import { previewBillImpact } from "@/lib/utils/settlement";
import { loadFixedExpenseBill } from "@/lib/actions/expenses";
import { useMonthlyData } from "@/lib/queries/use-monthly-data";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type FixedExpenseInstance = MonthlyData["fixedExpenseInstances"][number];

interface CoupleMemberProfile {
  readonly user_id: string;
  readonly full_name: string;
}

interface LoadBillSheetProps {
  readonly instance: FixedExpenseInstance;
  readonly coupleId: string;
  readonly month: string;
  /** "El mes pasado pagaste $X" — same source as the row's reference line
   * (`useLastBilledAmounts` + `resolveReferenceAmount`), used only as a
   * convenience default for the amount field. `null` renders no hint and
   * leaves the field blank. */
  readonly referenceAmount: number | null;
  readonly members: readonly CoupleMemberProfile[];
  readonly currentUserId?: string | null;
  /** The full month dataset (PR5) — feeds `previewBillImpact`'s reopen
   * warning. The parent only renders this sheet once its own
   * `useMonthlyData` call has resolved, so this is always populated here. */
  readonly monthlyData: MonthlyData;
  readonly onClose: () => void;
}

/**
 * "Cargar factura" — prices an AWAITING_BILL instance and flips it back to
 * counted (`loadFixedExpenseBill`, PR2). Reuses `ResponsiveModal` — the
 * mockup hand-rolled its own sheet chrome only because the local DS bundle
 * copy it was built against was stale; there is no new sheet primitive.
 *
 * PR5: the approved mockup's reopen warning ("Agosto ya estaba saldado...
 * deja una diferencia de $X") is wired here via `previewBillImpact` — a
 * live preview recomputed on every keystroke, shown only when it would
 * actually reopen an already-settled month.
 */
export function LoadBillSheet({
  instance,
  coupleId,
  month,
  referenceAmount,
  members,
  currentUserId,
  monthlyData,
  onClose,
}: LoadBillSheetProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(
    referenceAmount != null ? String(referenceAmount) : "",
  );
  const [payerId, setPayerId] = useState<string | null>(
    currentUserId ?? members[0]?.user_id ?? null,
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  const name = instance.fixed_expense_templates.description;

  // Live reopen-warning preview (PR5) — recomputed on every keystroke, null
  // unless the typed amount is a validly-shaped number AND actually reopens
  // an already-settled month. previewBillImpact is pure/cheap, so no
  // debounce is needed for a single-instance recompute.
  const parsedDraft = parseAmount(draft);
  const impactPreview = useMemo(() => {
    if (!Number.isFinite(parsedDraft) || parsedDraft <= 0) return null;
    return previewBillImpact({
      incomes: monthlyData.incomes,
      installmentPurchases: monthlyData.activeInstallmentPurchases,
      fixedExpenseInstances: monthlyData.fixedExpenseInstances,
      variableExpenses: monthlyData.variableExpenses,
      settlements: monthlyData.settlements,
      instanceId: instance.id,
      amount: parsedDraft,
    });
  }, [monthlyData, instance.id, parsedDraft]);

  const mutation = useMutation({
    mutationFn: ({ amount, payer }: { amount: number; payer: string | null }) =>
      loadFixedExpenseBill(instance.id, amount, payer ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["monthly-data", coupleId, month],
      });
      queryClient.invalidateQueries({
        queryKey: ["last-billed-amounts", coupleId, month],
      });
      onClose();
    },
    onError: (err: Error) => {
      setFieldError(err.message ?? "No se pudo cargar la factura");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseAmount(draft);
    if (!isValidBillAmount(parsed)) {
      setFieldError(
        `El monto debe ser mayor a cero y menor a ${formatARS(MAX_BILL_AMOUNT)}`,
      );
      return;
    }
    setFieldError(null);
    mutation.mutate({ amount: parsed, payer: payerId });
  }

  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Cargar factura"
      data-testid="load-bill-sheet"
    >
      <form onSubmit={handleSubmit}>
        <div
          className="mb-3.5 text-xs"
          style={{ color: "var(--fg-2)", fontFamily: "var(--font-sans)" }}
        >
          {name} · vence día{" "}
          {instance.due_day ?? instance.fixed_expense_templates.due_day}
        </div>

        <div className="mb-3.5">
          <label
            htmlFor="load-bill-amount"
            className="mb-1.5 block text-[13px] font-medium"
            style={{ color: "var(--fg-2)", fontFamily: "var(--font-sans)" }}
          >
            Monto de la factura
          </label>
          <div
            className="flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-(--accent)"
            style={{
              background: "var(--bg-sunken)",
              borderRadius: 10,
              border: "1.5px solid var(--accent)",
            }}
          >
            <span
              aria-hidden
              className="text-base font-semibold"
              style={{
                padding: "10px 6px 10px 12px",
                color: "var(--fg-3)",
                fontFamily: "var(--font-mono)",
              }}
            >
              $
            </span>
            <input
              id="load-bill-amount"
              data-testid="load-bill-amount"
              type="text"
              inputMode="decimal"
              autoFocus
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setFieldError(null);
              }}
              className="flex-1 text-base font-semibold"
              style={{
                border: "none",
                background: "transparent",
                padding: "10px 12px 10px 4px",
                fontFamily: "var(--font-mono)",
                outline: "none",
                color: "var(--fg-1)",
              }}
            />
          </div>
          {referenceAmount != null && (
            <div
              className="mt-1.5 flex items-center gap-1.5 text-xs"
              style={{ color: "var(--fg-2)", fontFamily: "var(--font-sans)" }}
            >
              El mes pasado pagaste {formatARS(referenceAmount)}
            </div>
          )}
          {impactPreview && (
            <div
              data-testid="load-bill-impact-warning"
              role="status"
              className="mt-1.5 text-xs"
              style={{
                color: "var(--status-warning-fg)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Este mes ya estaba saldado — cargar esta factura deja una
              diferencia de {formatARS(Math.abs(impactPreview.difference))}
            </div>
          )}
          {fieldError && (
            <div
              role="alert"
              className="mt-1 text-xs"
              style={{
                color: "var(--status-danger-text)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {fieldError}
            </div>
          )}
        </div>

        {members.length >= 2 && (
          <div className="mb-3.5">
            <div
              className="mb-2 text-[13px] font-medium"
              style={{ color: "var(--fg-2)", fontFamily: "var(--font-sans)" }}
            >
              Quién la pagó
            </div>
            <div
              data-testid="load-bill-payer-selector"
              style={{ display: "flex", gap: 8 }}
            >
              {members.map((m, idx) => {
                const person: "a" | "b" = idx === 0 ? "a" : "b";
                const isSelected = payerId === m.user_id;
                return (
                  <button
                    key={m.user_id}
                    type="button"
                    data-testid={`load-bill-payer-${m.user_id}`}
                    onClick={() => setPayerId(m.user_id)}
                    aria-pressed={isSelected}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: isSelected
                        ? "2px solid var(--accent)"
                        : "1.5px solid var(--border-default)",
                      background: isSelected
                        ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                        : "var(--bg-sunken)",
                      cursor: "pointer",
                      transition: "border 150ms, background 150ms",
                    }}
                  >
                    <PersonAvatar
                      initials={getInitials(m.full_name)}
                      person={person}
                      size="sm"
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? "var(--accent)" : "var(--fg-1)",
                        fontFamily: "var(--font-sans)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.full_name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Button
          type="submit"
          data-testid="load-bill-submit"
          disabled={mutation.isPending}
          className="w-full"
          style={{ opacity: mutation.isPending ? 0.7 : 1 }}
        >
          Cargar factura
        </Button>
        <button
          type="button"
          onClick={onClose}
          disabled={mutation.isPending}
          className="mt-2.5 w-full"
          style={{
            background: "var(--bg-sunken)",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            padding: "10px 4px",
            color: "var(--fg-1)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            opacity: mutation.isPending ? 0.5 : 1,
          }}
        >
          Cancelar
        </button>
      </form>
    </ResponsiveModal>
  );
}
