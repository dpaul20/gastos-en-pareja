"use server";

import { revalidatePath } from "next/cache";
import { getCouple } from "./expenses";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ── SETTLEMENTS ────────────────────────────────────────────────
//
// Real money movements between partners (settlements-and-pending-bills,
// PR5b — Phase 4a data layer, part 2/2). Reuses the shared `getCouple()`
// pattern already defined in expenses.ts (AGENTS.md §2) instead of
// duplicating couple resolution. Never touches expense attribution — see
// src/lib/utils/settlement.ts for the pure math this data layer feeds.

/**
 * Verifies `userId` is a member of `coupleId` — the IDOR guard for
 * `from_user_id`/`to_user_id`. Unlike `createInstallmentPurchase`'s payer
 * field (which silently falls back to the caller on an invalid id), a
 * settlement's two parties are the entire meaning of the record: silently
 * substituting one would record a transaction between the wrong people, so
 * this throws instead of falling back.
 */
async function assertCoupleMember(
  supabase: SupabaseClient<Database>,
  coupleId: string,
  userId: string,
): Promise<void> {
  const { data } = await supabase
    .from("couple_members")
    .select("user_id")
    .eq("couple_id", coupleId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) {
    throw new Error("La persona seleccionada no pertenece a esta pareja");
  }
}

function assertValidSettlement(params: {
  amount: number;
  from_user_id: string;
  to_user_id: string;
}): void {
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new Error("El monto debe ser mayor a cero");
  }
  if (params.from_user_id === params.to_user_id) {
    throw new Error("No podés registrar un pago a vos mismo");
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
  await assertCoupleMember(supabase, coupleId, data.from_user_id);
  await assertCoupleMember(supabase, coupleId, data.to_user_id);

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

  if (data.from_user_id) {
    await assertCoupleMember(supabase, coupleId, data.from_user_id);
  }
  if (data.to_user_id) {
    await assertCoupleMember(supabase, coupleId, data.to_user_id);
  }

  const { error } = await supabase
    .from("settlements")
    .update(data)
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
