"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getPreviousMonthDate } from "@/lib/utils";
import { resolveReferenceAmount } from "@/lib/utils/reference-amount";

/**
 * Resolves the "El mes pasado pagaste $X" reference amount for every
 * template that currently has an AWAITING_BILL instance in `month`, keyed
 * by `template_id`. Only fires when there is at least one AWAITING_BILL row
 * to annotate (`awaitingCount > 0`) — the sin-factura row treatment is the
 * only consumer.
 *
 * The actual "is this a fact or a fabrication" call is made by
 * `resolveReferenceAmount` (pure, Vitest-covered): a template whose
 * previous-month instance was itself AWAITING_BILL resolves to `null`, not
 * `template.amount` — this hook never overrides that.
 */
export function useLastBilledAmounts(
  coupleId: string | null,
  month: string,
  awaitingCount: number,
) {
  return useQuery({
    queryKey: ["last-billed-amounts", coupleId, month],
    enabled: !!coupleId && awaitingCount > 0,
    queryFn: async () => {
      if (!coupleId) return {};

      const supabase = createClient();
      // Same "parse the viewed month, not today" pattern fijo-item.tsx uses
      // for due-day clamping — this must resolve relative to the SELECTED
      // month, not the caller's local clock.
      const [year, monthNum] = month.split("-").map(Number);
      const monthReferenceDate = new Date(year, monthNum - 1, 1);
      const previousMonth = getPreviousMonthDate(monthReferenceDate);

      const { data, error } = await supabase
        .from("fixed_expense_instances")
        .select("*, fixed_expense_templates(*)")
        .eq("couple_id", coupleId)
        .eq("month", previousMonth);

      // Fix 3 (judgment-day review, AGENTS.md §9): a discarded `error` here
      // would silently resolve to `{}`, indistinguishable from "no prior
      // month has any billed row" — let TanStack Query's error state
      // surface this instead.
      if (error) throw error;

      const result: Record<string, number | null> = {};
      for (const instance of data ?? []) {
        result[instance.template_id] = resolveReferenceAmount(instance);
      }
      return result;
    },
  });
}
