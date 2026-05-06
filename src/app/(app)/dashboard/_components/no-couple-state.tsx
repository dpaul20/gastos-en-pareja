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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        padding: "32px 24px",
        gap: 16,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 40 }}>👋</div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--fg-1)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {showPendingState ? "Invitación pendiente" : "Creá tu pareja"}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--fg-2)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {showPendingState
          ? "Tu pareja todavía no aceptó la invitación."
          : "Para empezar, configurá tu pareja desde Configuración."}
      </div>
      <Link
        href="/settings"
        style={{
          background: "var(--accent)",
          color: "white",
          borderRadius: 12,
          padding: "12px 24px",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          fontFamily: "var(--font-sans)",
        }}
      >
        Ir a Configuración
      </Link>
    </div>
  );
}
