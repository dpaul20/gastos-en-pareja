import Link from "next/link";

export function NoCoupleState({
  hasMember,
  hasPendingInvitation,
}: {
  readonly hasMember: boolean;
  readonly hasPendingInvitation: boolean;
}) {
  const showPendingState = hasMember || hasPendingInvitation;

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-8 text-center">
      <div className="text-[40px]">👋</div>
      <div className="[font-family:var(--font-sans)] text-[20px] font-bold [color:var(--fg-1)]">
        {showPendingState ? "Invitación pendiente" : "Creá tu pareja"}
      </div>
      <div className="[font-family:var(--font-sans)] text-sm [color:var(--fg-2)]">
        {showPendingState
          ? "Tu pareja todavía no aceptó la invitación."
          : "Para empezar, configurá tu pareja desde Configuración."}
      </div>
      <Link
        href="/settings"
        className="rounded-[var(--radius-md)] [background-color:var(--accent)] px-6 py-3 [font-family:var(--font-sans)] text-sm font-semibold text-white no-underline"
      >
        Ir a Configuración
      </Link>
    </div>
  );
}
