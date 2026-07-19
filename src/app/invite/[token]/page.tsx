import { redirect } from "next/navigation";
import { acceptInvitation } from "@/lib/actions/couple";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Readonly<Props>) {
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
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al aceptar la invitación";
  }

  if (!error) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center [background-color:var(--bg-base)] p-8 [font-family:var(--font-sans)]">
      <div className="w-full max-w-[360px] rounded-[var(--radius-xl)] border [border-color:var(--border-subtle)] [background-color:var(--bg-elevated)] px-6 py-8 text-center shadow-[var(--shadow-md)]">
        <div className="mb-4 text-[40px]">⚠️</div>
        <div className="mb-2 text-lg font-bold [color:var(--fg-1)]">
          Invitación inválida
        </div>
        <div className="mb-6 text-sm [color:var(--fg-2)]">{error}</div>
        <a
          href="/dashboard"
          className="inline-block rounded-[var(--radius-md)] [background-color:var(--accent)] px-6 py-3 text-sm font-semibold text-white no-underline"
        >
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
