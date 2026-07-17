"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCoupleMemberProfiles } from "@/lib/actions/couple";
import { isInstallmentActiveInMonth } from "@/lib/utils/installments";

export function monthlyDataQueryOptions(
  coupleId: string | null,
  month: string,
) {
  return {
    queryKey: ["monthly-data", coupleId, month] as const,
    enabled: !!coupleId,
    staleTime: 0,
    queryFn: async () => {
      if (!coupleId) return null;

      const supabase = createClient();

      const [
        incomes,
        purchases,
        instances,
        variables,
        cards,
        overrides,
        settlements,
      ] = await Promise.all([
        supabase
          .from("incomes")
          .select("*")
          .eq("couple_id", coupleId)
          .eq("month", month)
          .order("created_at", { ascending: true }),

        supabase
          .from("installment_purchases")
          .select("*")
          .eq("couple_id", coupleId)
          .order("created_at", { ascending: false }),

        supabase
          .from("fixed_expense_instances")
          .select("*, fixed_expense_templates(*)")
          .eq("couple_id", coupleId)
          .eq("month", month),

        supabase
          .from("variable_expenses")
          .select("*")
          .eq("couple_id", coupleId)
          .gte("date", month)
          .lt("date", getNextMonth(month))
          .order("date", { ascending: false }),

        supabase.from("cards").select("*").eq("couple_id", coupleId),

        supabase
          .from("installment_month_overrides")
          .select("*")
          .eq("couple_id", coupleId)
          .eq("month", month),

        // 7th parallel query (design D3/Data Flow): settlements ride this
        // options object rather than a dedicated hook, so History's
        // useQueries over the same monthlyDataQueryOptions gets them for
        // free too — a separate hook would cost the same extra roundtrip.
        supabase
          .from("settlements")
          .select("*")
          .eq("couple_id", coupleId)
          .eq("month", month)
          .order("paid_on", { ascending: true }),
      ]);

      const installmentPurchases = purchases.data ?? [];

      return {
        incomes: incomes.data ?? [],
        // Full, unfiltered list — /expenses keeps listing every purchase
        // (including completed/future ones) regardless of the selected
        // month; only TOTALS get gated (see activeInstallmentPurchases).
        installmentPurchases,
        // Bug 1 (Leak A) / R3-B: totals must only include purchases that are
        // active in the SELECTED month, never keyed on `today`. Feed this —
        // not the full list — into calculateMonthlyBalance.
        activeInstallmentPurchases: installmentPurchases.filter((p) =>
          isInstallmentActiveInMonth(p, month),
        ),
        fixedExpenseInstances: instances.data ?? [],
        variableExpenses: variables.data ?? [],
        cards: cards.data ?? [],
        installmentMonthOverrides: overrides.data ?? [],
        settlements: settlements.data ?? [],
      };
    },
  };
}

export type MonthlyData = Awaited<
  ReturnType<ReturnType<typeof monthlyDataQueryOptions>["queryFn"]>
>;

export function useMonthlyData(coupleId: string | null, month: string) {
  return useQuery(monthlyDataQueryOptions(coupleId, month));
}

export function useCoupleMember() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["couple-member"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("couple_members")
        .select("*, couples(*)")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return data ?? null;
    },
  });
}

export function useCategories(coupleId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["categories", coupleId],
    queryFn: async () => {
      const { data } = await supabase
        .from("expense_categories")
        .select("*")
        .order("sort_order");
      return data ?? [];
    },
  });
}

export function useCoupleMemberProfiles(userId: string | null) {
  return useQuery({
    queryKey: ["couple-member-profiles", userId],
    enabled: !!userId,
    queryFn: () => getCoupleMemberProfiles(),
  });
}

function getNextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const next = new Date(year, m, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
}
