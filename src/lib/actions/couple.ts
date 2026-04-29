"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCouple() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // Use SECURITY DEFINER RPC — bypasses RLS on couples table.
  // Kong/PostgREST may not propagate ES256 JWT claims for direct table inserts,
  // so auth.uid() can be null even with a valid session. Passing user_id explicitly.
  const { data: coupleId, error } = await supabase.rpc(
    "create_couple_for_user",
    { p_user_id: user.id },
  );

  if (error || !coupleId)
    throw new Error(error?.message ?? "Error al crear la pareja");

  revalidatePath("/", "layout");
  return { coupleId };
}

export async function sendInvitation(coupleId: string, email: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // Rate limit: máx 5 invitaciones por usuario en la última hora
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase
    .from("invitations")
    .select("id", { count: "exact", head: true })
    .eq("inviter_id", user.id)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= 5) {
    throw new Error(
      "Límite de invitaciones alcanzado. Intentá de nuevo en una hora.",
    );
  }

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({ couple_id: coupleId, inviter_id: user.id, email })
    .select()
    .single();

  if (error || !invitation) throw new Error("Error al crear la invitación");

  // Build invite URL from request headers — no NEXT_PUBLIC_APP_URL needed
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const inviteUrl = `${proto}://${host}/invite/${invitation.token}`;

  // In dev: skip Resend and log the invite URL to the terminal (like Mailpit)
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📧 [DEV] Invitación para ${email}:\n   ${inviteUrl}\n`);
    return { token: invitation.token };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Gastos en Pareja <onboarding@resend.dev>",
      to: email,
      subject: `${user.email} te invitó a Gastos en Pareja`,
      html: `
        <p>Hola,</p>
        <p><strong>${user.email}</strong> te invitó a compartir los gastos del mes en Gastos en Pareja.</p>
        <p><a href="${inviteUrl}" style="background:#6C5CE7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Aceptar invitación</a></p>
        <p style="color:#999;font-size:12px;">El link expira en 7 días.</p>
      `,
    }),
  });

  if (!res.ok) throw new Error("Error al enviar el email");
  return { token: invitation.token };
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // Validate token
  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invitation) throw new Error("Invitación inválida o expirada");

  const service = await createServiceClient();

  // Add user as MEMBER
  const { error: memberError } = await service.from("couple_members").insert({
    couple_id: invitation.couple_id,
    user_id: user.id,
    role: "MEMBER",
  });
  if (memberError) throw new Error("Ya pertenecés a una pareja");

  // Mark couple as ACTIVE
  await service
    .from("couples")
    .update({ status: "ACTIVE" })
    .eq("id", invitation.couple_id);

  // Mark invitation as accepted
  await service
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  revalidatePath("/", "layout");
  return { coupleId: invitation.couple_id };
}
