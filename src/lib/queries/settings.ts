"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getMonthDate, getPreviousMonthDate } from "@/lib/utils";
import { getMyPendingInvitations } from "@/lib/actions/couple";

export function usePendingInvitation(coupleId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["pending-invitation", coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      if (!coupleId) return null;
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("invitations")
        .select("expires_at")
        .eq("couple_id", coupleId)
        .not("email", "is", null)
        .is("accepted_at", null)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
  });
}

export interface IncomeWithCarry {
  current: { amount: number } | null;
  previous: { amount: number } | null;
}

export function useIncomeWithCarry(
  coupleId: string | null,
  userId: string | null,
) {
  const supabase = createClient();
  const currentMonth = getMonthDate();
  const previousMonth = getPreviousMonthDate();

  return useQuery<IncomeWithCarry>({
    queryKey: ["income-with-carry", coupleId, userId, currentMonth],
    enabled: !!coupleId && !!userId,
    queryFn: async () => {
      if (!coupleId || !userId) return { current: null, previous: null };
      const { data, error } = await supabase
        .from("incomes")
        .select("amount, month")
        .eq("couple_id", coupleId)
        .eq("user_id", userId)
        .in("month", [currentMonth, previousMonth]);
      if (error) throw error;
      return {
        current: (data ?? []).find((r) => r.month === currentMonth) ?? null,
        previous: (data ?? []).find((r) => r.month === previousMonth) ?? null,
      };
    },
  });
}

export function useActiveLinkInvitation(coupleId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["active-link-invitation", coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      if (!coupleId) return null;
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("invitations")
        .select("token, expires_at")
        .eq("couple_id", coupleId)
        .is("email", null)
        .is("accepted_at", null)
        .gt("expires_at", now)
        .maybeSingle();
      return data ?? null;
    },
  });
}

export function useMyPendingInvitations() {
  return useQuery({
    queryKey: ["my-pending-invitations"],
    queryFn: () => getMyPendingInvitations(),
  });
}
