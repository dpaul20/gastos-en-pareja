import { Hand, MailCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function NoCoupleState({
  hasMember,
  hasPendingInvitation,
}: {
  readonly hasMember: boolean;
  readonly hasPendingInvitation: boolean;
}) {
  const showPendingState = hasMember || hasPendingInvitation;

  return (
    <div className="app-ambient flex min-h-full flex-col items-center justify-center">
      <EmptyState
        icon={showPendingState ? MailCheck : Hand}
        tone={showPendingState ? "neutral" : "accent"}
        title={showPendingState ? "Invitación pendiente" : "Creá tu pareja"}
        description={
          showPendingState
            ? "Tu pareja todavía no aceptó la invitación."
            : "Para empezar, configurá tu pareja desde Configuración."
        }
        action={{ label: "Ir a Configuración", href: "/settings" }}
      />
    </div>
  );
}
