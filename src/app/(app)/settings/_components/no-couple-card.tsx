import { Heart } from "lucide-react";
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
        <div className="float-y mx-auto flex size-14 items-center justify-center rounded-2xl [background-color:var(--accent-subtle)] [color:var(--accent)]">
          <Heart size={26} aria-hidden />
        </div>
        <div className="text-center [font-family:var(--font-sans)] text-sm [color:var(--fg-2)]">
          No tenés una pareja configurada todavía.
        </div>

        <PendingInvitationsCard invitations={pendingInvitations} />

        <Button
          onClick={onCreateCouple}
          disabled={isPending || pendingInvitations.length > 0}
          className="press h-auto w-full rounded-xl py-3 [font-family:var(--font-sans)] font-semibold disabled:opacity-70"
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
