import { redirect } from "next/navigation";
import Link from "next/link";
import { MailX } from "lucide-react";
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
    <div className="app-ambient flex min-h-dvh flex-col items-center justify-center [background-color:var(--bg-base)] p-8 [font-family:var(--font-sans)]">
      <div className="rise-in glass w-full max-w-[360px] rounded-3xl px-6 py-8 text-center">
        <div
          aria-hidden
          className="float-y mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl [background-color:var(--status-danger-subtle)] [color:var(--status-danger-text)]"
        >
          <MailX size={30} />
        </div>
        <div className="mb-2 text-lg font-bold [color:var(--fg-1)]">
          Invitación inválida
        </div>
        <div className="mb-6 text-sm [color:var(--fg-2)]">{error}</div>
        <Link
          href="/dashboard"
          className="press inline-flex h-12 w-full items-center justify-center rounded-2xl [background-color:var(--accent)] px-6 text-sm font-semibold [color:var(--accent-foreground)] no-underline shadow-[var(--shadow-accent)]"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
