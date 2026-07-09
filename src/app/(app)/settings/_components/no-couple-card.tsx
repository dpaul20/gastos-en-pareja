import { Card, CardContent } from "@/components/ui/card";
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
        <div
          style={{
            fontSize: 14,
            color: "var(--fg-2)",
            fontFamily: "var(--font-sans)",
          }}
        >
          No tenés una pareja configurada todavía.
        </div>

        <PendingInvitationsCard invitations={pendingInvitations} />

        <button
          onClick={onCreateCouple}
          disabled={isPending || pendingInvitations.length > 0}
          style={{
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            opacity: isPending || pendingInvitations.length > 0 ? 0.7 : 1,
          }}
        >
          Crear pareja
        </button>
        {coupleMessage && (
          <div
            aria-live="polite"
            style={{
              fontSize: 12,
              color: "var(--status-danger-text)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {coupleMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
