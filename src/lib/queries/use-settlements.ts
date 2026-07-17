"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSettlement,
  updateSettlement,
  deleteSettlement,
} from "@/lib/actions/settlements";

/**
 * Settlement mutation hooks (PR5b). Settlements have no dedicated FETCH hook
 * — they ride `monthlyDataQueryOptions`'s 7th parallel query (PR5a) so
 * History's `useQueries` over the same options gets them for free, per
 * design's Data Flow note. These hooks only wrap the write side and
 * invalidate that same `["monthly-data", coupleId, month]` cache entry.
 *
 * Consumed by PR6's settlement UI (settle-sheet.tsx / ledger edit/delete) —
 * no UI calls these yet in PR5b.
 */

function useInvalidateMonthlyData(coupleId: string | null, month: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: ["monthly-data", coupleId, month],
    });
}

export function useCreateSettlement(coupleId: string | null, month: string) {
  const invalidate = useInvalidateMonthlyData(coupleId, month);
  return useMutation({
    mutationFn: createSettlement,
    onSuccess: invalidate,
  });
}

export function useUpdateSettlement(coupleId: string | null, month: string) {
  const invalidate = useInvalidateMonthlyData(coupleId, month);
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateSettlement>[1];
    }) => updateSettlement(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteSettlement(coupleId: string | null, month: string) {
  const invalidate = useInvalidateMonthlyData(coupleId, month);
  return useMutation({
    mutationFn: (id: string) => deleteSettlement(id),
    onSuccess: invalidate,
  });
}
