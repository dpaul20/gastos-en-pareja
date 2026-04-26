"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getCouple() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .single();

  if (!data) throw new Error("No pertenecés a una pareja");
  return { supabase, user, coupleId: data.couple_id };
}

// ── INCOMES ──────────────────────────────────────────────────

export async function upsertIncome(amount: number, month: string) {
  const { supabase, user, coupleId } = await getCouple();

  await supabase.from("incomes").upsert(
    {
      couple_id: coupleId,
      user_id: user.id,
      amount,
      month,
    },
    { onConflict: "couple_id,user_id,month" },
  );

  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

// ── INSTALLMENT PURCHASES ─────────────────────────────────────

export async function createInstallmentPurchase(data: {
  description: string;
  total_amount: number;
  installments: number;
  first_payment_date: string;
}) {
  const { supabase, coupleId } = await getCouple();

  await supabase
    .from("installment_purchases")
    .insert({ ...data, couple_id: coupleId });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function incrementPaidInstallments(id: string) {
  const { supabase } = await getCouple();

  const { data } = await supabase
    .from("installment_purchases")
    .select("paid_installments, installments")
    .eq("id", id)
    .single();

  if (!data || data.paid_installments >= data.installments) return;

  await supabase
    .from("installment_purchases")
    .update({ paid_installments: data.paid_installments + 1 })
    .eq("id", id);

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteInstallmentPurchase(id: string) {
  const { supabase } = await getCouple();
  await supabase.from("installment_purchases").delete().eq("id", id);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

// ── FIXED EXPENSE TEMPLATES ───────────────────────────────────

export async function createFixedExpenseTemplate(data: {
  description: string;
  amount: number;
  due_day: number;
}) {
  const { supabase, coupleId } = await getCouple();
  await supabase
    .from("fixed_expense_templates")
    .insert({ ...data, couple_id: coupleId });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function toggleFixedExpenseInstance(
  instanceId: string,
  paid: boolean,
) {
  const { supabase } = await getCouple();
  await supabase
    .from("fixed_expense_instances")
    .update({ paid })
    .eq("id", instanceId);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function ensureFixedExpenseInstances(
  coupleId: string,
  month: string,
) {
  const { supabase } = await getCouple();

  const { data: templates } = await supabase
    .from("fixed_expense_templates")
    .select("id")
    .eq("couple_id", coupleId)
    .eq("active", true);

  if (!templates?.length) return;

  const { data: existing } = await supabase
    .from("fixed_expense_instances")
    .select("template_id")
    .eq("couple_id", coupleId)
    .eq("month", month);

  const existingIds = new Set(existing?.map((e) => e.template_id));
  const toCreate = templates
    .filter((t) => !existingIds.has(t.id))
    .map((t) => ({
      template_id: t.id,
      couple_id: coupleId,
      month,
      paid: false,
    }));

  if (toCreate.length) {
    await supabase.from("fixed_expense_instances").insert(toCreate);
  }
}

// ── VARIABLE EXPENSES ─────────────────────────────────────────

export async function createVariableExpense(data: {
  description: string;
  amount: number;
  date: string;
}) {
  const { supabase, user, coupleId } = await getCouple();

  await supabase.from("variable_expenses").insert({
    ...data,
    couple_id: coupleId,
    user_id: user.id,
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteVariableExpense(id: string) {
  const { supabase } = await getCouple();
  await supabase.from("variable_expenses").delete().eq("id", id);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
