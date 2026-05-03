"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getMonthDate } from "@/lib/utils";

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
        .is("accepted_at", null)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
  });
}

export function useCurrentIncome(
  coupleId: string | null,
  userId: string | null,
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["current-income", coupleId, userId],
    enabled: !!coupleId && !!userId,
    queryFn: async () => {
      if (!coupleId || !userId) return null;
      const { data } = await supabase
        .from("incomes")
        .select("amount")
        .eq("couple_id", coupleId)
        .eq("user_id", userId)
        .eq("month", getMonthDate())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
  });
}
