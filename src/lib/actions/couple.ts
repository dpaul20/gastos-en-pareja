"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/utils/email";

export async function createCouple() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const service = await createServiceClient();
  const { data: existingMember, error: existingMemberError } = await service
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMemberError) {
    throw new Error("No se pudo verificar tu pareja actual");
  }

  if (existingMember?.couple_id) {
    revalidatePath("/", "layout");
    return { coupleId: existingMember.couple_id };
  }

  const { data: couple, error: coupleError } = await service
    .from("couples")
    .insert({ status: "PENDING" })
    .select("id")
    .single();

  if (coupleError || !couple) {
    throw new Error("Error al crear la pareja");
  }

  const { error: memberError } = await service.from("couple_members").insert({
    couple_id: couple.id,
    user_id: user.id,
    role: "OWNER",
  });

  if (memberError) {
    await service.from("couples").delete().eq("id", couple.id);
    throw new Error("Error al vincular tu usuario a la pareja");
  }

  revalidatePath("/", "layout");
  return { coupleId: couple.id };
}

export async function sendInvitation(coupleId: string, email: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Ingresá un email válido");

  if (user.email?.toLowerCase() === normalizedEmail) {
    throw new Error("No podés invitarte a vos mismo");
  }

  const now = new Date().toISOString();
  const { data: existingInvitation, error: existingInvitationError } =
    await supabase
      .from("invitations")
      .select("*")
      .eq("couple_id", coupleId)
      .eq("email", normalizedEmail)
      .is("accepted_at", null)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (existingInvitationError) {
    throw new Error("No se pudo verificar la invitación existente");
  }

  let invitation = existingInvitation;
  const service = await createServiceClient();

  // Rate limit: máx 5 invitaciones por usuario en la última hora
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  if (!invitation) {
    const { error: cleanupError } = await service
      .from("invitations")
      .delete()
      .eq("couple_id", coupleId)
      .eq("email", normalizedEmail)
      .is("accepted_at", null)
      .lte("expires_at", now);

    if (cleanupError) {
      throw new Error("No se pudieron limpiar invitaciones expiradas");
    }

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

    const { data: createdInvitation, error } = await supabase
      .from("invitations")
      .insert({
        couple_id: coupleId,
        inviter_id: user.id,
        email: normalizedEmail,
      })
      .select()
      .single();

    if (error || !createdInvitation) {
      throw new Error("Error al crear la invitación");
    }

    invitation = createdInvitation;
  }

  // Build invite URL from request headers — no NEXT_PUBLIC_APP_URL needed
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const inviteUrl = `${proto}://${host}/invite/${invitation.token}`;

  await sendEmail({
    to: normalizedEmail,
    subject: `${user.email} te invitó a Gastos en Pareja`,
    html: `
      <p>Hola,</p>
      <p><strong>${user.email}</strong> te invitó a compartir los gastos del mes en Gastos en Pareja.</p>
      <p><a href="${inviteUrl}" style="background:#6C5CE7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Aceptar invitación</a></p>
      <p style="color:#999;font-size:12px;">El link expira en 7 días.</p>
    `,
  });

  return { token: invitation.token, expiresAt: invitation.expires_at };
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
