import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PendingInvitationsCard } from "./pending-invitations-card";

type PendingInvitationItem = { token: string };

export function NoCoupleCard({
  onCreateCouple,
  isPending,
  pendingInvitations,
  coupleMessage,
}: {
  readonly onCreateCouple: () => void;
  readonly isPending: boolean;
  readonly pendingInvitations: PendingInvitationItem[];
  readonly coupleMessage: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="[font-family:var(--font-sans)] text-sm [color:var(--fg-2)]">
          No tenés una pareja configurada todavía.
        </div>

        <PendingInvitationsCard invitations={pendingInvitations} />

        <Button
          onClick={onCreateCouple}
          disabled={isPending || pendingInvitations.length > 0}
          className="h-auto w-full rounded-[10px] py-2.5 [font-family:var(--font-sans)] font-semibold disabled:opacity-70"
        >
          Crear pareja
        </Button>
        {coupleMessage && (
          <div
            aria-live="polite"
            className="[font-family:var(--font-sans)] text-xs [color:var(--status-danger-text)]"
          >
            {coupleMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
