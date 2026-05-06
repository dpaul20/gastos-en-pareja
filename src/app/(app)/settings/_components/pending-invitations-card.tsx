type PendingInvitationItem = { token: string };

export function PendingInvitationsCard({
  invitations,
}: {
  readonly invitations: PendingInvitationItem[];
}) {
  if (invitations.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--bg-sunken)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 10,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--fg-1)",
          fontFamily: "var(--font-sans)",
        }}
      >
        Tenés invitaciones pendientes
      </div>

      {invitations.map((invitation) => (
        <a
          key={invitation.token}
          href={`/invite/${invitation.token}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            textDecoration: "none",
            color: "var(--accent)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          <span>Aceptar invitación</span>
          <span aria-hidden="true">→</span>
        </a>
      ))}
    </div>
  );
}
