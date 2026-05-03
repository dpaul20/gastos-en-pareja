"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/utils/email";
import {
  buildInviteUrl,
  canAcceptInvitationForEmail,
  normalizeInvitationEmail,
} from "@/lib/actions/couple-helpers";

export async function createCouple() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const normalizedUserEmail = normalizeInvitationEmail(user.email ?? "");
  if (normalizedUserEmail) {
    const now = new Date().toISOString();
    const { data: pendingInvitationForUser, error: pendingInvitationError } =
      await supabase
        .from("invitations")
        .select("token")
        .eq("email", normalizedUserEmail)
        .is("accepted_at", null)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (pendingInvitationError) {
      throw new Error("No se pudo verificar tus invitaciones pendientes");
    }

    if (pendingInvitationForUser) {
      throw new Error(
        "Tenés una invitación pendiente. Aceptala antes de crear una pareja nueva.",
      );
    }
  }

  const service = await createServiceClient();
  const { data: existingMember, error: existingMemberError } = await service
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
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

  const normalizedEmail = normalizeInvitationEmail(email);
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
  const inviteUrl = buildInviteUrl(
    h.get("host"),
    invitation.token,
    process.env.NODE_ENV,
  );

  try {
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
  } catch (error) {
    console.error("Invitation email delivery failed", {
      coupleId,
      invitationId: invitation.id,
      invitee: normalizedEmail,
      provider: process.env.EMAIL_PROVIDER ?? "brevo",
      error,
    });
    throw new Error(
      "La invitación se creó, pero no pudimos enviar el email. Verificá la configuración de correo e intentá nuevamente.",
    );
  }

  return {
    token: invitation.token,
    expiresAt: invitation.expires_at,
    deliveredVia:
      process.env.NODE_ENV === "production" ? "provider" : "dev-log",
  };
}

export async function getMyPendingInvitations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return [];
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("invitations")
    .select("token, couple_id, expires_at, created_at, email")
    .eq("email", normalizeInvitationEmail(user.email))
    .is("accepted_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudieron obtener tus invitaciones pendientes");
  }

  return data ?? [];
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
  if (!canAcceptInvitationForEmail(user.email, invitation.email)) {
    throw new Error("Esta invitación no corresponde a tu cuenta");
  }

  const service = await createServiceClient();

  const { data: existingMembership, error: existingMembershipError } =
    await service
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (existingMembershipError) {
    throw new Error("No se pudo validar tu estado actual de pareja");
  }

  if (
    existingMembership?.couple_id &&
    existingMembership.couple_id !== invitation.couple_id
  ) {
    throw new Error(
      "Ya pertenecés a otra pareja. Salí de esa pareja antes de aceptar una nueva invitación.",
    );
  }

  if (existingMembership?.couple_id === invitation.couple_id) {
    const acceptedAt = invitation.accepted_at ?? new Date().toISOString();
    await service
      .from("invitations")
      .update({ accepted_at: acceptedAt })
      .eq("id", invitation.id);
    await service
      .from("couples")
      .update({ status: "ACTIVE" })
      .eq("id", invitation.couple_id);

    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { coupleId: invitation.couple_id };
  }

  // Add user as MEMBER
  const { error: memberError } = await service.from("couple_members").insert({
    couple_id: invitation.couple_id,
    user_id: user.id,
    role: "MEMBER",
  });
  if (memberError) throw new Error("No se pudo aceptar la invitación");

  // Mark couple as ACTIVE
  const { error: activateError } = await service
    .from("couples")
    .update({ status: "ACTIVE" })
    .eq("id", invitation.couple_id);
  if (activateError) throw new Error("No se pudo activar la pareja");

  // Mark invitation as accepted
  const { error: acceptedError } = await service
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);
  if (acceptedError) throw new Error("No se pudo confirmar la invitación");

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { coupleId: invitation.couple_id };
}

export async function getCoupleMemberProfiles() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const service = await createServiceClient();
  const { data, error } = await service.rpc("get_couple_member_profiles", {
    p_user_id: user.id,
  });

  if (error) return [];
  return data ?? [];
}
