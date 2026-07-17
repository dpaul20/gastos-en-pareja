"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/shared/avatar";
import { ResponsiveModal } from "@/components/shared/responsive-modal";
import { formatARS, getInitials, getTodayBADate } from "@/lib/utils";
import { parseAmount } from "@/lib/utils/amount";
import { useCreateSettlement } from "@/lib/queries/use-settlements";

// ── SCHEMA ──────────────────────────────────────────────────────────────────

const settlementSchema = z.object({
  amount: z
    .string()
    .min(1, "Requerido")
    .refine((v) => {
      const n = parseAmount(v);
      return !Number.isNaN(n) && n > 0;
    }, "El monto debe ser mayor a 0"),
  paid_on: z.string().min(1, "Requerido"),
  note: z.string().optional(),
});

type SettlementForm = z.infer<typeof settlementSchema>;

interface Profile {
  readonly user_id: string;
  readonly full_name: string;
}

interface SettleSheetProps {
  readonly coupleId: string;
  readonly month: string;
  /** The two couple members, for the direction picker's names/avatars. */
  readonly members: readonly Profile[];
  /** Debtor — pre-filled as who pays (deduced from the balance, invertible). */
  readonly defaultFromUserId: string;
  /** Creditor — pre-filled as who receives. */
  readonly defaultToUserId: string;
  /** Remaining debt, pre-filled into the amount field ("lo que falta"). `0`
   * leaves the field blank rather than pre-filling a non-actionable zero. */
  readonly defaultAmount: number;
  readonly onClose: () => void;
}

/**
 * "Registrar pago" — records a real money movement between partners
 * (`createSettlement`, PR5b). A settlement is NOT an expense: it never
 * touches `calculateMonthlyBalance`, it only pays down the debt that balance
 * surfaced (design D3 — the structural invariant). Direction and amount are
 * pre-filled from the current balance and both are editable: the amount by
 * typing, the direction with "Invertir".
 */
export function SettleSheet({
  coupleId,
  month,
  members,
  defaultFromUserId,
  defaultToUserId,
  defaultAmount,
  onClose,
}: SettleSheetProps) {
  const [fromId, setFromId] = useState(defaultFromUserId);
  const [toId, setToId] = useState(defaultToUserId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettlementForm>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: defaultAmount > 0 ? String(defaultAmount) : "",
      paid_on: getTodayBADate(),
      note: "",
    },
  });

  const createSettlement = useCreateSettlement(coupleId, month);

  const personOf = (id: string): "a" | "b" =>
    members[0]?.user_id === id ? "a" : "b";
  const nameOf = (id: string): string =>
    members.find((m) => m.user_id === id)?.full_name.split(" ")[0] ?? "Alguien";
  const initialsOf = (id: string): string => {
    const full = members.find((m) => m.user_id === id)?.full_name;
    return full ? getInitials(full) : "?";
  };

  function invert() {
    setFromId(toId);
    setToId(fromId);
  }

  function onValid(values: SettlementForm) {
    setSubmitError(null);
    createSettlement.mutate(
      {
        month,
        from_user_id: fromId,
        to_user_id: toId,
        amount: parseAmount(values.amount),
        paid_on: values.paid_on,
        note: values.note?.trim() ? values.note.trim() : null,
      },
      {
        onSuccess: () => onClose(),
        onError: (err: Error) =>
          setSubmitError(err.message ?? "No se pudo registrar el pago"),
      },
    );
  }

  const labelStyle = {
    color: "var(--fg-2)",
    fontFamily: "var(--font-sans)",
  } as const;

  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Registrar pago"
      data-testid="settle-sheet"
    >
      <form onSubmit={handleSubmit(onValid)}>
        <div className="mb-3.5 text-xs" style={labelStyle}>
          Un pago real entre ustedes. No es un gasto.
        </div>

        {/* Direction — who paid whom */}
        <div className="mb-3.5">
          <span
            className="mb-1.5 block text-[13px] font-medium"
            style={labelStyle}
          >
            Quién le pagó a quién
          </span>
          <div
            data-testid="settle-direction"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 10,
              background: "var(--bg-sunken)",
              border: "1.5px solid var(--border-default)",
            }}
          >
            <PersonAvatar
              initials={initialsOf(fromId)}
              person={personOf(fromId)}
              size="sm"
            />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {nameOf(fromId)}
            </span>
            <span aria-hidden style={{ color: "var(--fg-3)" }}>
              →
            </span>
            <PersonAvatar
              initials={initialsOf(toId)}
              person={personOf(toId)}
              size="sm"
            />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {nameOf(toId)}
            </span>
            <button
              type="button"
              data-testid="settle-invert"
              onClick={invert}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "var(--accent)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                padding: 4,
              }}
            >
              Invertir
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="mb-3.5">
          <label
            htmlFor="settle-amount"
            className="mb-1.5 block text-[13px] font-medium"
            style={labelStyle}
          >
            Monto
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
              id="settle-amount"
              data-testid="settle-amount"
              type="text"
              inputMode="decimal"
              autoFocus
              className="flex-1 text-base font-semibold"
              style={{
                border: "none",
                background: "transparent",
                padding: "10px 12px 10px 4px",
                fontFamily: "var(--font-mono)",
                outline: "none",
                color: "var(--fg-1)",
              }}
              {...register("amount")}
            />
          </div>
          {defaultAmount > 0 && (
            <div
              className="mt-1.5 text-xs"
              style={{ color: "var(--fg-2)", fontFamily: "var(--font-sans)" }}
            >
              Lo que falta: {formatARS(defaultAmount)}
            </div>
          )}
          {errors.amount && (
            <div
              role="alert"
              className="mt-1 text-xs"
              style={{
                color: "var(--status-danger-text)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {errors.amount.message}
            </div>
          )}
        </div>

        {/* Date */}
        <div className="mb-3.5">
          <label
            htmlFor="settle-paid-on"
            className="mb-1.5 block text-[13px] font-medium"
            style={labelStyle}
          >
            Fecha
          </label>
          <input
            id="settle-paid-on"
            data-testid="settle-paid-on"
            type="date"
            className="w-full text-sm"
            style={{
              background: "var(--bg-sunken)",
              border: "1.5px solid var(--border-default)",
              borderRadius: 10,
              padding: "10px 12px",
              fontFamily: "var(--font-sans)",
              color: "var(--fg-1)",
              outline: "none",
            }}
            {...register("paid_on")}
          />
          {errors.paid_on && (
            <div
              role="alert"
              className="mt-1 text-xs"
              style={{
                color: "var(--status-danger-text)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {errors.paid_on.message}
            </div>
          )}
        </div>

        {/* Note (optional) */}
        <div className="mb-3.5">
          <label
            htmlFor="settle-note"
            className="mb-1.5 block text-[13px] font-medium"
            style={labelStyle}
          >
            Nota (opcional)
          </label>
          <input
            id="settle-note"
            data-testid="settle-note"
            type="text"
            placeholder="Transferencia, efectivo…"
            className="w-full text-sm"
            style={{
              background: "var(--bg-sunken)",
              border: "1.5px solid var(--border-default)",
              borderRadius: 10,
              padding: "10px 12px",
              fontFamily: "var(--font-sans)",
              color: "var(--fg-1)",
              outline: "none",
            }}
            {...register("note")}
          />
        </div>

        {submitError && (
          <div
            role="alert"
            className="mb-2 text-xs"
            style={{
              color: "var(--status-danger-text)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {submitError}
          </div>
        )}

        <Button
          type="submit"
          data-testid="settle-submit"
          disabled={createSettlement.isPending}
          className="w-full"
          style={{ opacity: createSettlement.isPending ? 0.7 : 1 }}
        >
          Registrar pago
        </Button>
        <button
          type="button"
          onClick={onClose}
          disabled={createSettlement.isPending}
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
            opacity: createSettlement.isPending ? 0.5 : 1,
          }}
        >
          Cancelar
        </button>
      </form>
    </ResponsiveModal>
  );
}
