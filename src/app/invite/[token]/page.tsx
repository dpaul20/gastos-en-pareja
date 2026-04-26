import { redirect } from "next/navigation";
import { acceptInvitation } from "@/lib/actions/couple";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/invite/${token}`);
  }

  let error: string | null = null;

  try {
    await acceptInvitation(token);
    redirect("/dashboard");
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al aceptar la invitación";
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: "32px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          borderRadius: 20,
          padding: "32px 24px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-md)",
          textAlign: "center",
          maxWidth: 360,
          width: "100%",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--fg-1)",
            marginBottom: 8,
          }}
        >
          Invitación inválida
        </div>
        <div style={{ fontSize: 14, color: "var(--fg-2)", marginBottom: 24 }}>
          {error}
        </div>
        <a
          href="/dashboard"
          style={{
            display: "inline-block",
            background: "var(--accent)",
            color: "white",
            borderRadius: 12,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
