import { Card, CardContent } from "@/components/ui/card";

type PendingInvitationItem = { token: string };

export function PendingInvitationsCard({
  invitations,
}: {
  readonly invitations: PendingInvitationItem[];
}) {
  if (invitations.length === 0) return null;

  return (
    <Card style={{ background: "var(--bg-sunken)" }}>
      <CardContent className="flex flex-col gap-2 p-3">
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
      </CardContent>
    </Card>
  );
}
