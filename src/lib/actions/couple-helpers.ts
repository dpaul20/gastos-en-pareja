export function normalizeInvitationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildInviteUrl(
  host: string | null,
  token: string,
  nodeEnv: string | undefined,
): string {
  const safeHost = host ?? "localhost:3000";
  const protocol = nodeEnv === "production" ? "https" : "http";
  return `${protocol}://${safeHost}/invite/${token}`;
}

export function canAcceptInvitationForEmail(
  userEmail: string | null | undefined,
  invitationEmail: string | null | undefined,
): boolean {
  const normalizedUser = normalizeInvitationEmail(userEmail ?? "");
  const normalizedInvitation = normalizeInvitationEmail(invitationEmail ?? "");

  if (!normalizedUser || !normalizedInvitation) {
    return false;
  }

  return normalizedUser === normalizedInvitation;
}
