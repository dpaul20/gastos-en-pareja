import { Card, CardContent } from "@/components/ui/card";

type PendingInvitationItem = { token: string };

export function PendingInvitationsCard({
  invitations,
}: {
  readonly invitations: PendingInvitationItem[];
}) {
  if (invitations.length === 0) return null;

  return (
    <Card className="bg-[var(--bg-sunken)]">
      <CardContent className="flex flex-col gap-2 p-3">
        <div className="[font-family:var(--font-sans)] text-[13px] font-semibold [color:var(--fg-1)]">
          Tenés invitaciones pendientes
        </div>

        {invitations.map((invitation) => (
          <a
            key={invitation.token}
            href={`/invite/${invitation.token}`}
            className="inline-flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border [border-color:var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 [font-family:var(--font-sans)] text-[13px] font-semibold [color:var(--accent)] no-underline"
          >
            <span>Aceptar invitación</span>
            <span aria-hidden="true">→</span>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
