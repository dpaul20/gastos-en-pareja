"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createInstallmentPurchase,
  createFixedExpenseTemplate,
  createVariableExpense,
} from "@/lib/actions/expenses";

export type Tab = "cuotas" | "fijos" | "variables";

export function useExpenseSave(tab: Tab) {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function save(
    fields: Record<string, string>,
    categoryId: string | null,
    autoRenew: boolean,
    requiresMonthlyReview = false,
  ) {
    startTransition(async () => {
      if (tab === "cuotas") {
        await createInstallmentPurchase({
          description: fields.description,
          total_amount: Number.parseFloat(fields.total_amount),
          installments: Number.parseInt(fields.installments),
          first_payment_date:
            fields.first_payment_date || new Date().toISOString().slice(0, 10),
          category_id: categoryId ?? undefined,
          auto_renew: autoRenew || undefined,
          credit_card: fields.credit_card?.trim() || null,
        });
      } else if (tab === "fijos") {
        await createFixedExpenseTemplate({
          description: fields.description,
          amount: Number.parseFloat(fields.amount),
          due_day: Number.parseInt(fields.due_day),
          category_id: categoryId ?? undefined,
          requires_monthly_review: requiresMonthlyReview || undefined,
        });
      } else {
        await createVariableExpense({
          description: fields.description,
          amount: Number.parseFloat(fields.amount),
          date: fields.date || new Date().toISOString().slice(0, 10),
          category_id: categoryId ?? undefined,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
    });
  }

  return { save, isPending };
}
