"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useMonthlyData(coupleId: string | null, month: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["monthly-data", coupleId, month],
    enabled: !!coupleId,
    queryFn: async () => {
      if (!coupleId) return null;

      const [incomes, purchases, instances, variables] = await Promise.all([
        supabase
          .from("incomes")
          .select("*")
          .eq("couple_id", coupleId)
          .eq("month", month),

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
      ]);

      return {
        incomes: incomes.data ?? [],
        installmentPurchases: purchases.data ?? [],
        fixedExpenseInstances: instances.data ?? [],
        variableExpenses: variables.data ?? [],
      };
    },
  });
}

export function useCoupleMember() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["couple-member"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("couple_members")
        .select("*, couples(*)")
        .eq("user_id", user.id)
        .single();

      return data ?? null;
    },
  });
}

export function useCoupleMemberProfiles(userId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["couple-member-profiles", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc("get_couple_member_profiles", {
        p_user_id: userId,
      });
      if (error) return [];
      return data ?? [];
    },
  });
}

function getNextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const next = new Date(year, m, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
}
