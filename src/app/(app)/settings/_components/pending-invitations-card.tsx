import { ArrowRight, MailPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type PendingInvitationItem = { token: string };

export function PendingInvitationsCard({
  invitations,
}: {
  readonly invitations: PendingInvitationItem[];
}) {
  if (invitations.length === 0) return null;

  return (
    <Card className="rise-in overflow-hidden bg-[var(--bg-sunken)]">
      <CardContent className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2 [font-family:var(--font-sans)] text-[13px] font-semibold [color:var(--fg-1)]">
          <MailPlus size={16} aria-hidden className="[color:var(--accent)]" />
          Tenés invitaciones pendientes
        </div>

        {invitations.map((invitation) => (
          <a
            key={invitation.token}
            href={`/invite/${invitation.token}`}
            className="press inline-flex min-h-11 items-center justify-between gap-2 rounded-xl border [border-color:var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 [font-family:var(--font-sans)] text-[13px] font-semibold [color:var(--accent)] no-underline"
          >
            <span>Aceptar invitación</span>
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
