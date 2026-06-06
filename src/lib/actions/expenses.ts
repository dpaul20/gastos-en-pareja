"use server";

import { createClient } from "@/lib/supabase/server";
import { getMonthDate } from "@/lib/utils";
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
  category_id?: string;
  auto_renew?: boolean;
  credit_card?: string | null;
  paid_by_user_id?: string;
}) {
  const { supabase, user, coupleId } = await getCouple();

  let payerId = data.paid_by_user_id ?? user.id;
  if (data.paid_by_user_id && data.paid_by_user_id !== user.id) {
    const { data: m } = await supabase
      .from("couple_members")
      .select("user_id")
      .eq("couple_id", coupleId)
      .eq("user_id", data.paid_by_user_id)
      .maybeSingle();
    if (!m) payerId = user.id;
  }

  const { paid_by_user_id: _ignored, ...rest } = data;
  const { error } = await supabase
    .from("installment_purchases")
    .insert({ ...rest, couple_id: coupleId, paid_by_user_id: payerId });

  if (error) throw new Error("No se pudo guardar la cuota");

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function incrementPaidInstallments(id: string) {
  const { supabase, coupleId } = await getCouple();

  const { data } = await supabase
    .from("installment_purchases")
    .select("*")
    .eq("id", id)
    .single();

  if (!data || data.paid_installments >= data.installments) return;

  const newPaid = data.paid_installments + 1;
  await supabase
    .from("installment_purchases")
    .update({ paid_installments: newPaid })
    .eq("id", id);

  // Auto-renovación: si se completó y auto_renew = true, crear nueva compra idéntica
  if (newPaid >= data.installments && data.auto_renew) {
    await supabase.from("installment_purchases").insert({
      couple_id: coupleId,
      description: data.description,
      total_amount: data.total_amount,
      installments: data.installments,
      paid_installments: 0,
      first_payment_date: new Date().toISOString().slice(0, 10),
      auto_renew: true,
      category_id: data.category_id,
      paid_by_user_id: data.paid_by_user_id,
    });
  }

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
  category_id?: string;
  requires_monthly_review?: boolean;
}) {
  const { supabase, coupleId } = await getCouple();
  const { data: template, error } = await supabase
    .from("fixed_expense_templates")
    .insert({ ...data, couple_id: coupleId })
    .select("id")
    .single();
  if (!error && template) {
    // Create an instance for the current month so it appears in the list immediately
    const month = getMonthDate();
    await supabase.from("fixed_expense_instances").insert({
      template_id: template.id,
      couple_id: coupleId,
      month,
      paid: false,
      status: data.requires_monthly_review
        ? "PENDING_CONFIRMATION"
        : "CONFIRMED",
    });
  }
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function updateFixedExpenseTemplate(
  templateId: string,
  data: {
    requires_monthly_review?: boolean;
    description?: string;
    amount?: number;
    due_day?: number;
    category_id?: string | null;
  },
): Promise<void> {
  const { supabase } = await getCouple();
  const { error } = await supabase
    .from("fixed_expense_templates")
    .update(data)
    .eq("id", templateId);
  if (error) throw new Error("No se pudo actualizar el servicio");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function confirmFixedExpenseInstance(
  instanceId: string,
): Promise<void> {
  const { supabase } = await getCouple();
  const { error } = await supabase
    .from("fixed_expense_instances")
    .update({ status: "CONFIRMED" })
    .eq("id", instanceId)
    .eq("status", "PENDING_CONFIRMATION"); // idempotent; no-op if already confirmed
  if (error) throw new Error("No se pudo confirmar el servicio");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function confirmAllFixedExpenseInstances(
  coupleId: string,
  month: string,
): Promise<void> {
  const { supabase, coupleId: myCoupleId } = await getCouple();
  if (coupleId !== myCoupleId) throw new Error("Pareja inválida");
  const { error } = await supabase
    .from("fixed_expense_instances")
    .update({ status: "CONFIRMED" })
    .eq("couple_id", coupleId)
    .eq("month", month)
    .eq("status", "PENDING_CONFIRMATION");
  if (error) throw new Error("No se pudieron confirmar los servicios");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function toggleFixedExpenseInstance(
  instanceId: string,
  paid: boolean,
) {
  const { supabase, user } = await getCouple();
  await supabase
    .from("fixed_expense_instances")
    .update({ paid, paid_by_user_id: paid ? user.id : null })
    .eq("id", instanceId);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function updateFixedExpenseInstanceAmount(
  instanceId: string,
  amount: number | null,
): Promise<void> {
  if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
    throw new Error("El monto debe ser mayor a cero");
  }

  const { supabase } = await getCouple();

  const { error } = await supabase
    .from("fixed_expense_instances")
    .update({ amount_override: amount })
    .eq("id", instanceId);

  if (error) throw new Error("No se pudo actualizar el monto");

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function ensureFixedExpenseInstances(
  coupleId: string,
  month: string,
): Promise<{ created: number }> {
  const { supabase } = await getCouple();

  const { data: templates } = await supabase
    .from("fixed_expense_templates")
    .select("id, requires_monthly_review")
    .eq("couple_id", coupleId)
    .eq("active", true);

  if (!templates?.length) return { created: 0 };

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
      status: t.requires_monthly_review ? "PENDING_CONFIRMATION" : "CONFIRMED",
    }));

  if (toCreate.length) {
    await supabase.from("fixed_expense_instances").insert(toCreate);
  }
  return { created: toCreate.length };
}

// ── VARIABLE EXPENSES ─────────────────────────────────────────

export async function createVariableExpense(data: {
  description: string;
  amount: number;
  date: string;
  category_id?: string;
  is_shared?: boolean;
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
