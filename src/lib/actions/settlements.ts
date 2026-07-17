"use server";

import { revalidatePath } from "next/cache";
import { getCouple } from "./expenses";
import { createServiceClient } from "@/lib/supabase/server";
import { assertValidSettlement } from "@/lib/utils/settlement";
import type { Database } from "@/types/database";

// ── SETTLEMENTS ────────────────────────────────────────────────
//
// Real money movements between partners (settlements-and-pending-bills,
// PR5b — Phase 4a data layer, part 2/2). Reuses the shared `getCouple()`
// pattern already defined in expenses.ts (AGENTS.md §2) instead of
// duplicating couple resolution. Never touches expense attribution — see
// src/lib/utils/settlement.ts for the pure math this data layer feeds.

type SettlementUpdate = Database["public"]["Tables"]["settlements"]["Update"];

/**
 * Verifies every id in `userIds` belongs to `coupleId` — the IDOR guard for
 * `from_user_id`/`to_user_id`.
 *
 * MUST use the service client. The `couple_members` SELECT policy is
 * `user_id = auth.uid()`, so the RLS client only ever sees the CALLER's own
 * membership row. A settlement's other party is, by definition, the partner,
 * whose row is invisible under RLS — validating it with the RLS client
 * rejected every real settlement. Same bug class already fixed in
 * `ensureIncomeCarriedForward`; one query reads the full member list and both
 * parties are checked against it.
 *
 * Throws instead of falling back (unlike `createInstallmentPurchase`'s payer
 * field): a settlement's two parties are the entire meaning of the record, so
 * silently substituting one would log a transaction between the wrong people.
 */
async function assertCoupleMembers(
  coupleId: string,
  userIds: string[],
): Promise<void> {
  const service = await createServiceClient();
  const { data: members } = await service
    .from("couple_members")
    .select("user_id")
    .eq("couple_id", coupleId);

  const memberIds = new Set((members ?? []).map((m) => m.user_id));
  for (const id of userIds) {
    if (!memberIds.has(id)) {
      throw new Error("La persona seleccionada no pertenece a esta pareja");
    }
  }
}

export async function createSettlement(data: {
  month: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  paid_on: string;
  note?: string | null;
}): Promise<void> {
  assertValidSettlement(data);
  const { supabase, user, coupleId } = await getCouple();

  // Either member may record a settlement between either party (spec:
  // "either member records"), so both ids are validated regardless of
  // which one matches the caller.
  await assertCoupleMembers(coupleId, [data.from_user_id, data.to_user_id]);

  const { error } = await supabase.from("settlements").insert({
    couple_id: coupleId,
    month: data.month,
    from_user_id: data.from_user_id,
    to_user_id: data.to_user_id,
    amount: data.amount,
    paid_on: data.paid_on,
    note: data.note ?? null,
    created_by: user.id,
  });

  if (error) throw new Error("No se pudo registrar el pago");

  revalidatePath("/dashboard");
  revalidatePath("/history");
}

export async function updateSettlement(
  id: string,
  data: {
    from_user_id?: string;
    to_user_id?: string;
    amount?: number;
    paid_on?: string;
    note?: string | null;
  },
): Promise<void> {
  const { supabase, coupleId } = await getCouple();

  const { data: current } = await supabase
    .from("settlements")
    .select("*")
    .eq("id", id)
    .eq("couple_id", coupleId)
    .maybeSingle();

  if (!current) throw new Error("Pago no encontrado");

  const nextFrom = data.from_user_id ?? current.from_user_id;
  const nextTo = data.to_user_id ?? current.to_user_id;
  const nextAmount = data.amount ?? Number(current.amount);

  assertValidSettlement({
    amount: nextAmount,
    from_user_id: nextFrom,
    to_user_id: nextTo,
  });

  // Only re-validate the parties that actually changed; both are read from
  // the same couple member list.
  const changedParties: string[] = [];
  if (data.from_user_id) changedParties.push(data.from_user_id);
  if (data.to_user_id) changedParties.push(data.to_user_id);
  if (changedParties.length) {
    await assertCoupleMembers(coupleId, changedParties);
  }

  // Whitelist the columns a client may update — never spread the raw payload
  // into `.update()`, which would let an unexpected key reach the table.
  const patch: SettlementUpdate = {};
  if (data.amount !== undefined) patch.amount = data.amount;
  if (data.note !== undefined) patch.note = data.note;
  if (data.paid_on !== undefined) patch.paid_on = data.paid_on;
  if (data.from_user_id !== undefined) patch.from_user_id = data.from_user_id;
  if (data.to_user_id !== undefined) patch.to_user_id = data.to_user_id;

  const { error } = await supabase
    .from("settlements")
    .update(patch)
    .eq("id", id)
    .eq("couple_id", coupleId);

  if (error) throw new Error("No se pudo actualizar el pago");

  revalidatePath("/dashboard");
  revalidatePath("/history");
}

export async function deleteSettlement(id: string): Promise<void> {
  const { supabase, coupleId } = await getCouple();

  const { error } = await supabase
    .from("settlements")
    .delete()
    .eq("id", id)
    .eq("couple_id", coupleId);

  if (error) throw new Error("No se pudo eliminar el pago");

  revalidatePath("/dashboard");
  revalidatePath("/history");
}
