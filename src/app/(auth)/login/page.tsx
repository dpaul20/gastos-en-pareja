"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const IS_DEV = process.env.NODE_ENV === "development";

const FEATURES = [
  { icon: "⚖️", text: "Distribución proporcional a ingresos" },
  { icon: "📅", text: "Control de cuotas y gastos fijos" },
  { icon: "🔄", text: "Sincronizado entre los dos" },
];

function AppLogo({ size = 80 }: { size?: number }) {
  const radius = Math.round(size * 0.3);
  return (
    <div
      className="flex shrink-0 items-center justify-center shadow-[var(--shadow-lg)]"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background:
          "linear-gradient(135deg, var(--color-violet-500) 0%, var(--color-violet-400) 100%)",
      }}
    >
      <svg
        aria-hidden="true"
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--fg-inverse)"
        strokeWidth="1.5"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      className="size-[22px]"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FeatureList() {
  return (
    <ul
      aria-label="Características"
      className="m-0 flex w-full list-none flex-col gap-2.5 p-0"
    >
      {FEATURES.map((f) => (
        <li
          key={f.text}
          className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow-sm)]"
        >
          <span className="text-[18px]">{f.icon}</span>
          <span className="[font-family:var(--font-sans)] text-sm font-medium [color:var(--fg-2)]">
            {f.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function LoginContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [devEmail, setDevEmail] = useState("");
  const [devPassword, setDevPassword] = useState("");
  const [devError, setDevError] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setDevError(null);
    setDevLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPassword,
    });
    setDevLoading(false);
    if (error) {
      setDevError(error.message);
    } else {
      const next = searchParams.get("next");
      router.push(next?.startsWith("/") ? next : "/dashboard");
    }
  }

  async function signInWithGoogle() {
    const next = searchParams.get("next");
    const redirectPath = next?.startsWith("/") ? next : "/dashboard";
    const redirectUrl = new URL("/auth/callback", globalThis.location.origin);
    redirectUrl.searchParams.set("next", redirectPath);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl.toString() },
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-base)] md:flex-row">
      {/* ── Branding panel — desktop left side ──────────────── */}
      <div
        className="hidden flex-1 flex-col items-center justify-center gap-10 border-r border-[var(--border-subtle)] p-16 md:flex"
        style={{
          background:
            "linear-gradient(160deg, color-mix(in srgb, var(--accent) 6%, var(--bg-elevated)) 0%, var(--bg-elevated) 65%)",
        }}
      >
        <AppLogo size={96} />
        <div className="text-center">
          <h1 className="mb-2.5 [font-family:var(--font-sans)] text-4xl leading-[1.2] font-bold tracking-[-0.02em] [color:var(--fg-1)]">
            Gastos en Pareja
          </h1>
          <p className="[font-family:var(--font-sans)] text-base leading-normal [color:var(--fg-2)]">
            Gestioná los gastos del mes
            <br />
            de forma proporcional
          </p>
        </div>
        <div className="w-full max-w-[360px]">
          <FeatureList />
        </div>
      </div>

      {/* ── Login panel ──────────────────────────────────────── */}
      <main className="flex flex-col items-center px-8 pt-[60px] pb-12 md:w-120 md:shrink-0 md:justify-center">
        {/* Mobile only: logo + tagline + features */}
        <div className="flex w-full max-w-[390px] flex-1 flex-col items-center justify-center gap-5 md:hidden">
          <AppLogo size={80} />
          <div className="text-center">
            <h1 className="[font-family:var(--font-sans)] text-[28px] leading-[1.2] font-bold tracking-[-0.02em] [color:var(--fg-1)]">
              Gastos en Pareja
            </h1>
            <p className="mt-2 [font-family:var(--font-sans)] text-[15px] leading-normal [color:var(--fg-2)]">
              Gestioná los gastos del mes
              <br />
              de forma proporcional
            </p>
          </div>
          <FeatureList />
        </div>

        {/* Desktop only: section heading */}
        <div className="mb-8 hidden w-full max-w-[360px] md:block">
          <p className="mb-1 [font-family:var(--font-sans)] text-[22px] font-bold [color:var(--fg-1)]">
            Bienvenido
          </p>
          <p className="[font-family:var(--font-sans)] text-sm [color:var(--fg-2)]">
            Ingresá para gestionar los gastos del mes
          </p>
        </div>

        {/* CTA — always visible */}
        <div className="w-full max-w-[360px]">
          <Button
            type="button"
            variant="outline"
            onClick={signInWithGoogle}
            className="h-auto w-full gap-3 rounded-[14px] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-4 [font-family:var(--font-sans)] text-base font-semibold [color:var(--fg-1)] shadow-[var(--shadow-sm)] hover:bg-[var(--bg-elevated)] hover:[color:var(--fg-1)]"
          >
            <GoogleIcon />
            Continuar con Google
          </Button>
          <p className="mt-3.5 text-center [font-family:var(--font-sans)] text-xs [color:var(--fg-3)]">
            Al continuar aceptás los términos de uso
          </p>

          {IS_DEV && (
            <form
              onSubmit={signInWithEmail}
              className="mt-6 flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] p-4"
            >
              <div className="[font-family:var(--font-sans)] text-[11px] font-semibold tracking-[0.08em] [color:var(--fg-3)] uppercase">
                Dev — seed users
              </div>
              <label htmlFor="dev-email" className="sr-only">
                Email
              </label>
              <Input
                id="dev-email"
                type="email"
                placeholder="persona_a@test.local"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                required
                autoComplete="email"
                spellCheck={false}
                className="h-auto rounded-[10px] border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 py-2.5 [font-family:var(--font-sans)] text-sm [color:var(--fg-1)] shadow-none"
              />
              <label htmlFor="dev-password" className="sr-only">
                Contraseña
              </label>
              <Input
                id="dev-password"
                type="password"
                placeholder="password123"
                value={devPassword}
                onChange={(e) => setDevPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-auto rounded-[10px] border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 py-2.5 [font-family:var(--font-sans)] text-sm [color:var(--fg-1)] shadow-none"
              />
              {devError && (
                <div
                  role="alert"
                  className="[font-family:var(--font-sans)] text-xs [color:var(--status-danger-text)]"
                >
                  {devError}
                </div>
              )}
              <Button
                type="submit"
                disabled={devLoading}
                className="h-auto w-full rounded-[10px] px-2.5 py-2.5 [font-family:var(--font-sans)] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {devLoading ? "Entrando…" : "Entrar"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
