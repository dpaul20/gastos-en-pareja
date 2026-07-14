"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createInstallmentPurchase,
  createFixedExpenseTemplate,
  createVariableExpense,
  updateInstallmentPurchase,
  updateVariableExpense,
} from "@/lib/actions/expenses";
import { parseAmount } from "@/lib/utils/amount";

export type Tab = "cuotas" | "fijos" | "variables";

function parsePositiveNumber(value: string | undefined): number {
  const n = parseAmount(value ?? "");
  if (Number.isNaN(n) || n <= 0) throw new Error(`Monto inválido: "${value}"`);
  return n;
}

function parsePositiveInt(value: string | undefined): number {
  const n = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(n) || n < 1) throw new Error(`Número inválido: "${value}"`);
  return n;
}

export function useExpenseSave(tab: Tab) {
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  function save(
    fields: Record<string, string>,
    categoryId: string | null,
    autoRenew: boolean,
    requiresMonthlyReview = false,
    isShared = true,
    payerId?: string | null,
    cardId?: string | null,
    editId?: string | null,
  ) {
    setSaveError(null);
    startTransition(async () => {
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
              category_id: categoryId ?? undefined,
              auto_renew: autoRenew || undefined,
              card_id: cardId ?? null,
              paid_by_user_id: payerId ?? undefined,
            });
          } else {
            await createInstallmentPurchase({
              description: fields.description,
              total_amount: parsePositiveNumber(fields.total_amount),
              installments: parsePositiveInt(fields.installments),
              first_payment_date:
                fields.first_payment_date ||
                new Date().toISOString().slice(0, 10),
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
            requires_monthly_review: requiresMonthlyReview || undefined,
            is_shared: isShared,
            owner_user_id: isShared ? null : payerId,
          });
        } else {
          if (editId) {
            await updateVariableExpense(editId, {
              description: fields.description,
              amount: parsePositiveNumber(fields.amount),
              date: fields.date || undefined,
              category_id: categoryId ?? undefined,
              is_shared: isShared,
            });
          } else {
            await createVariableExpense({
              description: fields.description,
              amount: parsePositiveNumber(fields.amount),
              date: fields.date || new Date().toISOString().slice(0, 10),
              category_id: categoryId ?? undefined,
              is_shared: isShared,
            });
          }
        }
        queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "No se pudo guardar el gasto",
        );
      }
    });
  }

  return { save, isPending, saveError };
}
