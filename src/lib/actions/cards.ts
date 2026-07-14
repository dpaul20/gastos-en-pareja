"use server";

import { revalidatePath } from "next/cache";
import { getCouple } from "@/lib/actions/expenses";
import type { Database } from "@/types/database";

type CardRow = Database["public"]["Tables"]["cards"]["Row"];

// ── CARDS ────────────────────────────────────────────────────

export async function createCard(data: {
  name: string;
  payment_day?: number | null;
  closing_day?: number | null;
}): Promise<CardRow> {
  const { supabase, coupleId } = await getCouple();

  const { data: card, error } = await supabase
    .from("cards")
    .insert({
      name: data.name,
      payment_day: data.payment_day ?? null,
      closing_day: data.closing_day ?? null,
      couple_id: coupleId,
    })
    .select("*")
    .single();

  if (error || !card) throw new Error("No se pudo crear la tarjeta");

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return card;
}

export async function updateCard(
  id: string,
  data: {
    name?: string;
    payment_day?: number | null;
    closing_day?: number | null;
  },
): Promise<void> {
  const { supabase } = await getCouple();

  const { error } = await supabase.from("cards").update(data).eq("id", id);

  if (error) throw new Error("No se pudo actualizar la tarjeta");

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteCard(id: string): Promise<void> {
  const { supabase } = await getCouple();

  const { error } = await supabase.from("cards").delete().eq("id", id);

  if (error) throw new Error("No se pudo eliminar la tarjeta");

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
