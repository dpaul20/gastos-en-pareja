"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useCards(coupleId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["cards", coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      const { data } = await supabase
        .from("cards")
        .select("*")
        .eq("couple_id", coupleId as string)
        .order("name", { ascending: true });
      return data ?? [];
    },
  });
}
