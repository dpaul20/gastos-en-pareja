"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notify, haptic } from "@/lib/feedback/notify";
import {
  describeError,
  UserFacingError,
  type ErrorDescription,
} from "@/lib/utils/describe-error";
import {
  createInstallmentPurchase,
  createFixedExpenseTemplate,
  createVariableExpense,
  updateInstallmentPurchase,
  updateVariableExpense,
} from "@/lib/actions/expenses";
import { parseAmount } from "@/lib/utils/amount";
import { getTodayBADate, formatARS } from "@/lib/utils";

export type Tab = "cuotas" | "fijos" | "variables";

function parsePositiveNumber(value: string | undefined): number {
  const n = parseAmount(value ?? "");
  if (Number.isNaN(n) || n <= 0) {
    throw new UserFacingError("Revisá el monto: tiene que ser mayor a cero");
  }
  return n;
}

function parsePositiveInt(value: string | undefined): number {
  const n = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(n) || n < 1) {
    throw new UserFacingError("Revisá el número: tiene que ser 1 o más");
  }
  return n;
}

const SAVED_TITLE: Record<Tab, string> = {
  cuotas: "Compra en cuotas guardada",
  fijos: "Servicio fijo guardado",
  variables: "Gasto guardado",
};

const ERROR_TITLE: Record<Tab, string> = {
  cuotas: "No pudimos guardar la compra",
  fijos: "No pudimos guardar el servicio",
  variables: "No pudimos guardar el gasto",
};

export function useExpenseSave(tab: Tab) {
  const [isPending, setIsPending] = useState(false);
  const [saveError, setSaveError] = useState<ErrorDescription | null>(null);
  const queryClient = useQueryClient();

  /** Resolves to true only when the expense was really persisted. */
  async function save(
    fields: Record<string, string>,
    categoryId: string | null,
    autoRenew: boolean,
    isShared = true,
    payerId?: string | null,
    cardId?: string | null,
    editId?: string | null,
  ): Promise<boolean> {
    setSaveError(null);
    setIsPending(true);
    try {
      if (tab === "cuotas") {
        if (editId) {
          // Commit 6 / R3-C: a cuota edit is an error correction — it
          // mutates the row directly (recalc-all), never a forward-only
          // amount_override like fijos.
          await updateInstallmentPurchase(editId, {
            description: fields.description,
            total_amount: parsePositiveNumber(fields.total_amount),
            installments: parsePositiveInt(fields.installments),
            // Edit path: send explicit values so unchecking auto-renew or
            // clearing the category actually persist (a `|| undefined` /
            // `?? undefined` would silently drop the false/null and leave
            // the old value in place).
            category_id: categoryId ?? null,
            auto_renew: autoRenew,
            card_id: cardId ?? null,
            paid_by_user_id: payerId ?? undefined,
          });
        } else {
          await createInstallmentPurchase({
            description: fields.description,
            total_amount: parsePositiveNumber(fields.total_amount),
            installments: parsePositiveInt(fields.installments),
            first_payment_date: fields.first_payment_date || getTodayBADate(),
            category_id: categoryId ?? undefined,
            auto_renew: autoRenew || undefined,
            card_id: cardId ?? null,
            paid_by_user_id: payerId ?? undefined,
          });
        }
      } else if (tab === "fijos") {
        await createFixedExpenseTemplate({
          description: fields.description,
          amount: parsePositiveNumber(fields.amount),
          due_day: parsePositiveInt(fields.due_day),
          category_id: categoryId ?? undefined,
          is_shared: isShared,
          owner_user_id: isShared ? null : payerId,
        });
      } else if (editId) {
        await updateVariableExpense(editId, {
          description: fields.description,
          amount: parsePositiveNumber(fields.amount),
          date: fields.date || undefined,
          category_id: categoryId ?? undefined,
          is_shared: isShared,
          paid_by_user_id: payerId ?? null,
        });
      } else {
        await createVariableExpense({
          description: fields.description,
          amount: parsePositiveNumber(fields.amount),
          date: fields.date || getTodayBADate(),
          category_id: categoryId ?? undefined,
          is_shared: isShared,
          paid_by_user_id: payerId ?? undefined,
        });
      }
    } catch (err) {
      setSaveError(
        describeError(err, {
          online: navigator.onLine,
          fallbackTitle: ERROR_TITLE[tab],
        }),
      );
      haptic("error");
      setIsPending(false);
      return false;
    }

    // Persisted — a failing refetch must not read as a failed save.
    void queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
    const amount = parseAmount(fields.total_amount ?? fields.amount ?? "");
    notify.success(editId ? "Cambios guardados" : SAVED_TITLE[tab], {
      description: Number.isNaN(amount)
        ? fields.description
        : `${fields.description} · ${formatARS(amount)}`,
    });
    setIsPending(false);
    return true;
  }

  function clearError() {
    setSaveError(null);
  }

  return { save, isPending, saveError, clearError };
}
