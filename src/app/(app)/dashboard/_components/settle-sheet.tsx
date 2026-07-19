"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/shared/avatar";
import { ResponsiveModal } from "@/components/shared/responsive-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatARS, getInitials, getTodayBADate } from "@/lib/utils";
import { parseAmount } from "@/lib/utils/amount";
import {
  useCreateSettlement,
  useUpdateSettlement,
  useDeleteSettlement,
} from "@/lib/queries/use-settlements";

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

/** The existing settlement being edited — a subset of the DB row. */
interface EditingSettlement {
  readonly id: string;
  readonly from_user_id: string;
  readonly to_user_id: string;
  readonly amount: number;
  readonly paid_on: string;
  readonly note: string | null;
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
  /** When present the sheet EDITS this settlement (update + delete) instead of
   * creating a new one; its fields pre-fill the form. */
  readonly editing?: EditingSettlement;
  readonly onClose: () => void;
}

/**
 * "Registrar pago" / "Editar pago" — records or amends a real money movement
 * between partners (`createSettlement`/`updateSettlement`, PR5b). A settlement
 * is NOT an expense: it never touches `calculateMonthlyBalance`, it only pays
 * down the debt that balance surfaced (design D3 — the structural invariant).
 * Direction and amount pre-fill from the current balance (create) or the
 * edited row, and both stay editable: amount by typing, direction with
 * "Invertir".
 */
export function SettleSheet({
  coupleId,
  month,
  members,
  defaultFromUserId,
  defaultToUserId,
  defaultAmount,
  editing,
  onClose,
}: SettleSheetProps) {
  const isEditing = editing !== undefined;
  const [fromId, setFromId] = useState(
    editing?.from_user_id ?? defaultFromUserId,
  );
  const [toId, setToId] = useState(editing?.to_user_id ?? defaultToUserId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettlementForm>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: editing
        ? String(editing.amount)
        : defaultAmount > 0
          ? String(defaultAmount)
          : "",
      paid_on: editing?.paid_on ?? getTodayBADate(),
      note: editing?.note ?? "",
    },
  });

  const createSettlement = useCreateSettlement(coupleId, month);
  const updateSettlement = useUpdateSettlement(coupleId, month);
  const deleteSettlement = useDeleteSettlement(coupleId, month);
  const isBusy =
    createSettlement.isPending ||
    updateSettlement.isPending ||
    deleteSettlement.isPending;

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
    const onError = (err: Error) =>
      setSubmitError(err.message ?? "No se pudo registrar el pago");
    const onSuccess = () => onClose();

    if (editing) {
      updateSettlement.mutate(
        {
          id: editing.id,
          data: {
            from_user_id: fromId,
            to_user_id: toId,
            amount: parseAmount(values.amount),
            paid_on: values.paid_on,
            note: values.note?.trim() ? values.note.trim() : null,
          },
        },
        { onSuccess, onError },
      );
      return;
    }

    createSettlement.mutate(
      {
        month,
        from_user_id: fromId,
        to_user_id: toId,
        amount: parseAmount(values.amount),
        paid_on: values.paid_on,
        note: values.note?.trim() ? values.note.trim() : null,
      },
      { onSuccess, onError },
    );
  }

  function handleDelete() {
    if (!editing) return;
    deleteSettlement.mutate(editing.id, {
      onSuccess: () => onClose(),
      onError: (err: Error) =>
        setSubmitError(err.message ?? "No se pudo eliminar el pago"),
    });
  }

  const labelClassName = "[color:var(--fg-2)] [font-family:var(--font-sans)]";

  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isEditing ? "Editar pago" : "Registrar pago"}
      data-testid="settle-sheet"
    >
      <form onSubmit={handleSubmit(onValid)}>
        <div className={`mb-3.5 text-xs ${labelClassName}`}>
          Un pago real entre ustedes. No es un gasto.
        </div>

        {/* Direction — who paid whom */}
        <div className="mb-3.5">
          <span
            className={`mb-1.5 block text-[13px] font-medium ${labelClassName}`}
          >
            Quién le pagó a quién
          </span>
          <div
            data-testid="settle-direction"
            className="flex items-center gap-2 rounded-[10px] border-[1.5px] [border-color:var(--border-default)] [background-color:var(--bg-sunken)] px-3 py-2.5"
          >
            <PersonAvatar
              initials={initialsOf(fromId)}
              person={personOf(fromId)}
              size="sm"
            />
            <span className="text-[13px] font-semibold">{nameOf(fromId)}</span>
            <span aria-hidden className="[color:var(--fg-3)]">
              →
            </span>
            <PersonAvatar
              initials={initialsOf(toId)}
              person={personOf(toId)}
              size="sm"
            />
            <span className="text-[13px] font-semibold">{nameOf(toId)}</span>
            <button
              type="button"
              data-testid="settle-invert"
              onClick={invert}
              className="ml-auto cursor-pointer border-none bg-transparent p-1 [font-family:var(--font-sans)] text-[11px] font-bold [color:var(--accent)]"
            >
              Invertir
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="mb-3.5">
          <label
            htmlFor="settle-amount"
            className={`mb-1.5 block text-[13px] font-medium ${labelClassName}`}
          >
            Monto
          </label>
          <div className="flex items-center overflow-hidden rounded-[10px] border-[1.5px] [border-color:var(--accent)] [background-color:var(--bg-sunken)] focus-within:ring-2 focus-within:ring-(--accent)">
            <span
              aria-hidden
              className="ds-amount py-2.5 pr-1.5 pl-3 text-base font-semibold [color:var(--fg-3)]"
            >
              $
            </span>
            <input
              id="settle-amount"
              data-testid="settle-amount"
              type="text"
              inputMode="decimal"
              autoFocus
              className="ds-amount flex-1 border-none bg-transparent py-2.5 pr-3 pl-1 text-base font-semibold [color:var(--fg-1)] outline-none"
              {...register("amount")}
            />
          </div>
          {!isEditing && defaultAmount > 0 && (
            <div className="mt-1.5 [font-family:var(--font-sans)] text-xs [color:var(--fg-2)]">
              Lo que falta: {formatARS(defaultAmount)}
            </div>
          )}
          {errors.amount && (
            <div
              role="alert"
              className="mt-1 [font-family:var(--font-sans)] text-xs [color:var(--status-danger-text)]"
            >
              {errors.amount.message}
            </div>
          )}
        </div>

        {/* Date */}
        <div className="mb-3.5">
          <label
            htmlFor="settle-paid-on"
            className={`mb-1.5 block text-[13px] font-medium ${labelClassName}`}
          >
            Fecha
          </label>
          <input
            id="settle-paid-on"
            data-testid="settle-paid-on"
            type="date"
            className="w-full rounded-[10px] border-[1.5px] [border-color:var(--border-default)] [background-color:var(--bg-sunken)] px-3 py-2.5 [font-family:var(--font-sans)] text-sm [color:var(--fg-1)] outline-none"
            {...register("paid_on")}
          />
          {errors.paid_on && (
            <div
              role="alert"
              className="mt-1 [font-family:var(--font-sans)] text-xs [color:var(--status-danger-text)]"
            >
              {errors.paid_on.message}
            </div>
          )}
        </div>

        {/* Note (optional) */}
        <div className="mb-3.5">
          <label
            htmlFor="settle-note"
            className={`mb-1.5 block text-[13px] font-medium ${labelClassName}`}
          >
            Nota (opcional)
          </label>
          <input
            id="settle-note"
            data-testid="settle-note"
            type="text"
            placeholder="Transferencia, efectivo…"
            className="w-full rounded-[10px] border-[1.5px] [border-color:var(--border-default)] [background-color:var(--bg-sunken)] px-3 py-2.5 [font-family:var(--font-sans)] text-sm [color:var(--fg-1)] outline-none"
            {...register("note")}
          />
        </div>

        {submitError && (
          <div
            role="alert"
            className="mb-2 [font-family:var(--font-sans)] text-xs [color:var(--status-danger-text)]"
          >
            {submitError}
          </div>
        )}

        <Button
          type="submit"
          data-testid="settle-submit"
          disabled={isBusy}
          className={`w-full ${isBusy ? "opacity-70" : ""}`}
        >
          {isEditing ? "Guardar cambios" : "Registrar pago"}
        </Button>
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className={`mt-2.5 w-full cursor-pointer rounded-[10px] border-none [background-color:var(--bg-sunken)] px-1 py-2.5 [font-family:var(--font-sans)] text-[13px] font-semibold [color:var(--fg-1)] ${isBusy ? "opacity-50" : ""}`}
        >
          Cancelar
        </button>

        {isEditing && (
          <button
            type="button"
            data-testid="settle-delete"
            onClick={() => setConfirmDelete(true)}
            disabled={isBusy}
            className={`mt-2 w-full cursor-pointer border-none bg-transparent px-1 py-2 [font-family:var(--font-sans)] text-[13px] font-semibold [color:var(--status-danger-text)] ${isBusy ? "opacity-50" : ""}`}
          >
            Eliminar pago
          </button>
        )}
      </form>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar este pago?"
        description="El pago se borra del historial y la deuda vuelve a reflejarlo. No se puede deshacer."
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={handleDelete}
      />
    </ResponsiveModal>
  );
}
