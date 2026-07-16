"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatARS, getMonthDate, getTodayBADate } from "@/lib/utils";
import { isTemplateActiveInMonth } from "@/lib/utils/month-gating";
import {
  isValidInstallmentsEdit,
  isValidOverrideInstallmentNumber,
} from "@/lib/utils/installments";
import {
  canMarkAwaitingBill,
  resolveInitialInstanceStatus,
} from "@/lib/utils/fixed-instance-transitions";
import { isValidBillAmount, MAX_BILL_AMOUNT } from "@/lib/utils/bill-amount";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";

type InstallmentRow =
  Database["public"]["Tables"]["installment_purchases"]["Row"];
type VariableRow = Database["public"]["Tables"]["variable_expenses"]["Row"];

export async function getCouple() {
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

export async function ensureIncomeCarriedForward(
  coupleId: string,
  month: string,
): Promise<{ created: number }> {
  const { supabase } = await getCouple();

  // The couple_members SELECT policy is `user_id = auth.uid()`, so the RLS
  // client only ever sees the current user's own membership row. To carry the
  // partner's income forward we need the full member list, so read it with the
  // service client (same pattern as getCoupleMemberProfiles).
  const service = await createServiceClient();
  const { data: members } = await service
    .from("couple_members")
    .select("user_id")
    .eq("couple_id", coupleId);

  if (!members?.length) return { created: 0 };

  const { data: existing } = await supabase
    .from("incomes")
    .select("user_id")
    .eq("couple_id", coupleId)
    .eq("month", month);

  const existingUserIds = new Set(existing?.map((e) => e.user_id));
  const missingUserIds = members
    .map((m) => m.user_id)
    .filter((id) => !existingUserIds.has(id));

  if (!missingUserIds.length) return { created: 0 };

  let created = 0;
  for (const userId of missingUserIds) {
    const { data: lastIncome } = await supabase
      .from("incomes")
      .select("amount")
      .eq("couple_id", coupleId)
      .eq("user_id", userId)
      .lt("month", month)
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastIncome) {
      await supabase.from("incomes").insert({
        couple_id: coupleId,
        user_id: userId,
        month,
        amount: lastIncome.amount,
      });
      created++;
    }
  }

  if (created > 0) {
    revalidatePath("/dashboard");
    revalidatePath("/settings");
  }
  return { created };
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
  card_id?: string | null;
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

// Commit 6 / R3-C — a cuota edit is an ERROR CORRECTION, not a forward-only
// change: it mutates the row directly, so total_amount/installments edits
// recalc ALL months (balance.ts computes round(total_amount/installments)
// live per month — no amount_override path exists for cuotas, unlike fijos).
export async function updateInstallmentPurchase(
  id: string,
  data: {
    description?: string;
    total_amount?: number;
    installments?: number;
    category_id?: string | null;
    auto_renew?: boolean;
    card_id?: string | null;
    paid_by_user_id?: string | null;
  },
): Promise<void> {
  const { supabase, coupleId } = await getCouple();

  const { data: current } = await supabase
    .from("installment_purchases")
    .select("*")
    .eq("id", id)
    .eq("couple_id", coupleId)
    .maybeSingle();

  if (!current) throw new Error("Cuota no encontrada");

  if (data.description !== undefined && data.description.trim().length === 0) {
    throw new Error("La descripción es obligatoria");
  }

  if (
    data.total_amount !== undefined &&
    (!Number.isFinite(data.total_amount) || data.total_amount <= 0)
  ) {
    throw new Error("El monto total debe ser mayor a cero");
  }

  const nextInstallments = data.installments ?? current.installments;
  if (!Number.isInteger(nextInstallments) || nextInstallments < 1) {
    throw new Error("Las cuotas deben ser un número entero mayor a cero");
  }
  // R3-C clamp: an edit can never set fewer installments than already paid.
  if (!isValidInstallmentsEdit(nextInstallments, current.paid_installments)) {
    throw new Error(
      `No podés poner ${nextInstallments} cuotas: ya se pagaron ${current.paid_installments}`,
    );
  }

  if (data.paid_by_user_id) {
    const { data: m } = await supabase
      .from("couple_members")
      .select("user_id")
      .eq("couple_id", coupleId)
      .eq("user_id", data.paid_by_user_id)
      .maybeSingle();
    if (!m) throw new Error("Pareja inválida para el pagador");
  }

  const { error } = await supabase
    .from("installment_purchases")
    .update(data)
    .eq("id", id)
    .eq("couple_id", coupleId);

  if (error) throw new Error("No se pudo actualizar la cuota");

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
      first_payment_date: getTodayBADate(),
      auto_renew: true,
      category_id: data.category_id,
      // Keep the renewed cuota linked to the same card as the original.
      card_id: data.card_id,
      credit_card: data.credit_card,
      paid_by_user_id: data.paid_by_user_id,
    });
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteInstallmentPurchase(
  id: string,
): Promise<InstallmentRow | null> {
  const { supabase } = await getCouple();
  const { data: row } = await supabase
    .from("installment_purchases")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("installment_purchases").delete().eq("id", id);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return row;
}

export async function restoreInstallmentPurchase(
  row: InstallmentRow,
): Promise<void> {
  const { supabase } = await getCouple();
  await supabase.from("installment_purchases").insert(row);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

// R3-D/R3-E: manual correction of a card+payment_day cuota's DISPLAYED
// installment number for one specific month. Always wins over the computed
// value (see installmentNumberForMonth precedence) and persists across later
// views of that same month.
export async function upsertInstallmentMonthOverride(
  purchaseId: string,
  month: string,
  installmentNumber: number,
): Promise<void> {
  if (!Number.isInteger(installmentNumber) || installmentNumber < 1) {
    throw new Error("El número de cuota debe ser mayor a cero");
  }

  const { supabase, coupleId } = await getCouple();

  // Never trust the client purchaseId: verify it belongs to this couple and
  // read its installment count so the override can't point at someone else's
  // cuota or exceed the real number of installments.
  const { data: purchase } = await supabase
    .from("installment_purchases")
    .select("id, installments")
    .eq("id", purchaseId)
    .eq("couple_id", coupleId)
    .maybeSingle();

  if (!purchase) throw new Error("Cuota no encontrada");

  if (
    !isValidOverrideInstallmentNumber(installmentNumber, purchase.installments)
  ) {
    throw new Error(
      `El número de cuota debe estar entre 1 y ${purchase.installments}`,
    );
  }

  const { error } = await supabase.from("installment_month_overrides").upsert(
    {
      purchase_id: purchaseId,
      couple_id: coupleId,
      month,
      installment_number: installmentNumber,
    },
    { onConflict: "purchase_id,month" },
  );

  if (error) throw new Error("No se pudo corregir el número de cuota");

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
  awaits_bill?: boolean;
  is_shared?: boolean;
  owner_user_id?: string | null;
}) {
  const { supabase, coupleId } = await getCouple();
  // A shared template must not carry an owner; a personal one must name it.
  const isShared = data.is_shared ?? true;
  const ownerUserId = isShared ? null : (data.owner_user_id ?? null);
  if (!isShared && !ownerUserId) {
    throw new Error("Un gasto personal necesita un responsable");
  }
  // Fix 5 (judgment-day review): coerce at the action boundary — TS can't
  // stop a raw POST from sending a truthy non-boolean ("false" as a
  // string), so only a real `=== true` takes the AWAITING_BILL branch or
  // gets persisted onto the template's own column.
  const awaitsBill = data.awaits_bill === true;
  const { data: template, error: templateError } = await supabase
    .from("fixed_expense_templates")
    .insert({
      ...data,
      awaits_bill: awaitsBill,
      couple_id: coupleId,
      is_shared: isShared,
      owner_user_id: ownerUserId,
    })
    .select("id")
    .single();
  // Fix 7 (judgment-day review): this used to discard `error` entirely and
  // return as if the template existed. Surface it instead of a silent
  // false-positive success.
  if (templateError || !template) {
    throw new Error("No se pudo crear el servicio");
  }
  // Create an instance for the current month so it appears in the list
  // immediately. awaits_bill takes precedence over requires_monthly_review
  // — a template that hasn't got its bill yet starts AWAITING_BILL
  // regardless of the (legacy, dead) review flag.
  const month = getMonthDate();
  const { error: instanceError } = await supabase
    .from("fixed_expense_instances")
    .insert({
      template_id: template.id,
      couple_id: coupleId,
      month,
      paid: false,
      status: resolveInitialInstanceStatus({
        awaits_bill: awaitsBill,
        requires_monthly_review: data.requires_monthly_review,
      }),
    });
  // Fix 7: same — this insert's result was previously discarded entirely,
  // so a flagged template could silently end up with no first-month
  // instance at all.
  if (instanceError) {
    throw new Error(
      "El servicio se creó pero no se pudo generar su primera instancia",
    );
  }
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function updateFixedExpenseTemplate(
  templateId: string,
  data: {
    requires_monthly_review?: boolean;
    awaits_bill?: boolean;
    description?: string;
    amount?: number;
    due_day?: number;
    category_id?: string | null;
  },
): Promise<void> {
  const { supabase, coupleId } = await getCouple();
  // Fix 5 (judgment-day review): same boundary coercion as
  // createFixedExpenseTemplate — only touch the field if the caller sent
  // it, and only ever persist a real boolean.
  const payload = {
    ...data,
    ...(data.awaits_bill !== undefined && {
      awaits_bill: data.awaits_bill === true,
    }),
  };
  const { error } = await supabase
    .from("fixed_expense_templates")
    .update(payload)
    .eq("id", templateId)
    // Fix 4 (judgment-day review): every other template/instance write in
    // this file scopes by coupleId as defense-in-depth; this one relied on
    // RLS alone. This repo has shipped one broken RLS policy before
    // (20260503000001_fix_rls_row_security.sql) — don't leave a write path
    // resting solely on it.
    .eq("couple_id", coupleId);
  if (error) throw new Error("No se pudo actualizar el servicio");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deactivateFixedExpenseTemplate(
  templateId: string,
): Promise<void> {
  const { supabase } = await getCouple();

  const { error } = await supabase
    .from("fixed_expense_templates")
    .update({ active: false })
    .eq("id", templateId);
  if (error) throw new Error("No se pudo eliminar el servicio");

  // Drop the current-month instance so the service leaves the active list.
  // Past-month instances stay as history, and ensureFixedExpenseInstances will
  // not regenerate it because the template is now inactive.
  await supabase
    .from("fixed_expense_instances")
    .delete()
    .eq("template_id", templateId)
    .eq("month", getMonthDate());

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function reactivateFixedExpenseTemplate(
  templateId: string,
): Promise<void> {
  const { supabase, coupleId } = await getCouple();

  const { error } = await supabase
    .from("fixed_expense_templates")
    .update({ active: true })
    .eq("id", templateId);
  if (error) throw new Error("No se pudo restaurar el servicio");

  // Recreate the current-month instance dropped on deactivate, if still missing.
  const month = getMonthDate();
  const { data: existing } = await supabase
    .from("fixed_expense_instances")
    .select("id")
    .eq("template_id", templateId)
    .eq("month", month)
    .maybeSingle();

  if (!existing) {
    const { data: tmpl } = await supabase
      .from("fixed_expense_templates")
      .select("requires_monthly_review, awaits_bill")
      .eq("id", templateId)
      .maybeSingle();
    const { error: instanceError } = await supabase
      .from("fixed_expense_instances")
      .insert({
        template_id: templateId,
        couple_id: coupleId,
        month,
        paid: false,
        status: resolveInitialInstanceStatus({
          awaits_bill: tmpl?.awaits_bill,
          requires_monthly_review: tmpl?.requires_monthly_review,
        }),
      });
    // Fix 7 (judgment-day review): previously discarded entirely — a
    // reactivated template could silently end up with no current-month
    // instance.
    if (instanceError) {
      throw new Error(
        "El servicio se reactivó pero no se pudo generar la instancia del mes",
      );
    }
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

// ── SIN FACTURA (pending-bills) ────────────────────────────────

// Per-instance override, independent of the template's `awaits_bill` flag:
// "un mes Expensas no llegó" — this month only, the template stays untouched.
// Also serves as the reverse-override path when an AWAITING_BILL instance
// with a stale amount_override needs to go back to unpriced (clearing the
// override so it can't resurface once the real bill is loaded later).
export async function markFixedExpenseInstanceAwaitingBill(
  instanceId: string,
): Promise<void> {
  const { supabase, coupleId } = await getCouple();

  const { data: current } = await supabase
    .from("fixed_expense_instances")
    .select("status")
    .eq("id", instanceId)
    .eq("couple_id", coupleId)
    .maybeSingle();

  if (!current) throw new Error("Servicio no encontrado");
  // Fix 1 (judgment-day review): a pure precondition, not a JS truthiness
  // check inline — see the docstring on canMarkAwaitingBill for the
  // "paid=true is still revertible" decision.
  if (!canMarkAwaitingBill(current.status)) {
    throw new Error("El servicio ya está sin factura");
  }

  // Fix 1: re-check the same rule inside the UPDATE's WHERE clause (`.neq`)
  // so a concurrent loadFixedExpenseBill racing between the read above and
  // this write can't be silently clobbered — this is the atomic guard, the
  // read above is only for a clearer error message. Also clears `paid`,
  // `paid_by_user_id`, and `billed_at` alongside `amount_override`: leaving
  // any of those stale on a reverted row is its own bug (a "paid, unpriced"
  // instance; a stale `billed_at` that could wrongly light PR3's 48h
  // "nuevo" pill).
  const { data: updated, error } = await supabase
    .from("fixed_expense_instances")
    .update({
      status: "AWAITING_BILL",
      amount_override: null,
      paid: false,
      paid_by_user_id: null,
      billed_at: null,
    })
    .eq("id", instanceId)
    .eq("couple_id", coupleId)
    .neq("status", "AWAITING_BILL")
    .select("id");

  if (error) {
    throw new Error("No se pudo marcar el servicio como sin factura");
  }
  // Fix 1: 0 affected rows means the state changed underneath us between
  // the read and the write (e.g. a concurrent loadFixedExpenseBill just
  // ran) — surface that instead of returning silent success.
  if (!updated || updated.length === 0) {
    throw new Error(
      "No se pudo marcar sin factura: el servicio cambió de estado, volvé a intentar",
    );
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

// "Cargar factura" — atomically prices an AWAITING_BILL instance and flips
// it back to counted. Sets amount_override, paid_by_user_id, status=
// 'CONFIRMED', and billed_at=now() (source of truth for the "nuevo" pill,
// PR3). Scoped to AWAITING_BILL so it can't silently reprice an
// already-billed instance through this path — use
// updateFixedExpenseInstanceAmount for that.
//
// PR3: the approved "Cargar factura" sheet lets the user pick WHO paid
// (mirrors createInstallmentPurchase's payerId resolution) — PR2 hardcoded
// `paid_by_user_id` to the caller. `payerId` is optional and validated
// against couple_members; an invalid/foreign id silently falls back to the
// caller rather than throwing, same as createInstallmentPurchase.
export async function loadFixedExpenseBill(
  instanceId: string,
  amount: number,
  payerId?: string,
): Promise<void> {
  if (!isValidBillAmount(amount)) {
    throw new Error(
      `El monto debe ser mayor a cero y menor a ${formatARS(MAX_BILL_AMOUNT)}`,
    );
  }

  const { supabase, user, coupleId } = await getCouple();

  let resolvedPayerId = payerId ?? user.id;
  if (payerId && payerId !== user.id) {
    const { data: m } = await supabase
      .from("couple_members")
      .select("user_id")
      .eq("couple_id", coupleId)
      .eq("user_id", payerId)
      .maybeSingle();
    if (!m) resolvedPayerId = user.id;
  }

  const { data, error } = await supabase
    .from("fixed_expense_instances")
    .update({
      amount_override: amount,
      paid_by_user_id: resolvedPayerId,
      status: "CONFIRMED",
      billed_at: new Date().toISOString(),
    })
    .eq("id", instanceId)
    .eq("couple_id", coupleId)
    .eq("status", "AWAITING_BILL")
    .select("id");

  if (error) throw new Error("No se pudo cargar la factura");
  // Fix 2 (judgment-day review): the `.eq("status","AWAITING_BILL")` scope
  // means a double-tap (or a concurrent mark-awaiting) matches 0 rows with
  // `error` staying null — previously that returned as if it succeeded.
  // Surface it so the caller can tell "landed" from "silently ignored".
  if (!data || data.length === 0) {
    throw new Error("Esta factura ya fue cargada");
  }

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

  // Storing the template amount as an override would keep the "editado" badge
  // showing forever, so re-entering the template amount clears the override instead.
  let amountOverride = amount;
  if (amount !== null) {
    const { data: instance } = await supabase
      .from("fixed_expense_instances")
      .select("fixed_expense_templates(amount)")
      .eq("id", instanceId)
      .single();

    if (instance?.fixed_expense_templates?.amount === amount) {
      amountOverride = null;
    }
  }

  const { error } = await supabase
    .from("fixed_expense_instances")
    .update({ amount_override: amountOverride })
    .eq("id", instanceId);

  if (error) throw new Error("No se pudo actualizar el monto");

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function updateFixedExpenseInstanceDueDay(
  instanceId: string,
  dueDay: number,
): Promise<void> {
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    throw new Error("El día de vencimiento debe estar entre 1 y 31");
  }

  const { supabase } = await getCouple();

  const { data: instance } = await supabase
    .from("fixed_expense_instances")
    .select("fixed_expense_templates(due_day)")
    .eq("id", instanceId)
    .single();

  const dueDayOverride =
    instance?.fixed_expense_templates?.due_day === dueDay ? null : dueDay;

  const { error } = await supabase
    .from("fixed_expense_instances")
    .update({ due_day: dueDayOverride })
    .eq("id", instanceId);

  if (error) throw new Error("No se pudo actualizar el día de vencimiento");

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
    .select("id, requires_monthly_review, awaits_bill, created_at")
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
    // Bug 1 Leak B: never materialize an instance for a month earlier than
    // the template's own creation month — recurring items only count from
    // their start month forward.
    .filter((t) => isTemplateActiveInMonth(t.created_at, month))
    .map((t) => ({
      template_id: t.id,
      couple_id: coupleId,
      month,
      paid: false,
      status: resolveInitialInstanceStatus({
        awaits_bill: t.awaits_bill,
        requires_monthly_review: t.requires_monthly_review,
      }),
    }));

  if (toCreate.length) {
    const { error } = await supabase
      .from("fixed_expense_instances")
      .insert(toCreate);
    // Fix 7 (judgment-day review): previously discarded entirely — a batch
    // failure would report `created: toCreate.length` as if every instance
    // (including any AWAITING_BILL one) had actually been materialized.
    if (error) {
      throw new Error("No se pudieron generar los gastos fijos del mes");
    }
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

export async function updateVariableExpense(
  id: string,
  data: {
    description?: string;
    amount?: number;
    date?: string;
    category_id?: string | null;
    is_shared?: boolean;
  },
): Promise<void> {
  if (data.description !== undefined && data.description.trim().length === 0) {
    throw new Error("La descripción es obligatoria");
  }
  if (
    data.amount !== undefined &&
    (!Number.isFinite(data.amount) || data.amount <= 0)
  ) {
    throw new Error("El monto debe ser mayor a cero");
  }

  const { supabase, coupleId } = await getCouple();

  const { error } = await supabase
    .from("variable_expenses")
    .update(data)
    .eq("id", id)
    .eq("couple_id", coupleId);

  if (error) throw new Error("No se pudo actualizar la compra");

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteVariableExpense(
  id: string,
): Promise<VariableRow | null> {
  const { supabase } = await getCouple();
  const { data: row } = await supabase
    .from("variable_expenses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("variable_expenses").delete().eq("id", id);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return row;
}

export async function restoreVariableExpense(row: VariableRow): Promise<void> {
  const { supabase } = await getCouple();
  await supabase.from("variable_expenses").insert(row);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
