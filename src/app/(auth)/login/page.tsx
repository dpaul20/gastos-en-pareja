"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background:
          "linear-gradient(135deg, var(--color-violet-500) 0%, var(--color-violet-400) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "var(--shadow-lg)",
        flexShrink: 0,
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
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: "100%",
        listStyle: "none",
        margin: 0,
        padding: 0,
      }}
    >
      {FEATURES.map((f) => (
        <li
          key={f.text}
          style={{
            background: "var(--bg-elevated)",
            borderRadius: 12,
            border: "1px solid var(--border-subtle)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span style={{ fontSize: 18 }}>{f.icon}</span>
          <span
            style={{
              fontSize: 14,
              color: "var(--fg-2)",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
            }}
          >
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
    <div
      className="flex min-h-dvh flex-col md:flex-row"
      style={{ background: "var(--bg-base)" }}
    >
      {/* ── Branding panel — desktop left side ──────────────── */}
      <div
        className="hidden flex-1 flex-col items-center justify-center gap-10 p-16 md:flex"
        style={{
          background:
            "linear-gradient(160deg, color-mix(in srgb, var(--accent) 6%, var(--bg-elevated)) 0%, var(--bg-elevated) 65%)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <AppLogo size={96} />
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "var(--fg-1)",
              letterSpacing: "-0.02em",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.2,
              margin: "0 0 10px",
            }}
          >
            Gastos en Pareja
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--fg-2)",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Gestioná los gastos del mes
            <br />
            de forma proporcional
          </p>
        </div>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <FeatureList />
        </div>
      </div>

      {/* ── Login panel ──────────────────────────────────────── */}
      <main
        className="flex flex-col items-center md:w-120 md:shrink-0 md:justify-center"
        style={{
          minHeight: "100dvh",
          padding: "60px 32px 48px",
        }}
      >
        {/* Mobile only: logo + tagline + features */}
        <div
          className="flex w-full flex-1 flex-col items-center justify-center gap-5 md:hidden"
          style={{ maxWidth: 390 }}
        >
          <AppLogo size={80} />
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "var(--fg-1)",
                letterSpacing: "-0.02em",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Gastos en Pareja
            </h1>
            <p
              style={{
                fontSize: 15,
                color: "var(--fg-2)",
                marginTop: 8,
                lineHeight: 1.5,
                fontFamily: "var(--font-sans)",
                margin: "8px 0 0",
              }}
            >
              Gestioná los gastos del mes
              <br />
              de forma proporcional
            </p>
          </div>
          <FeatureList />
        </div>

        {/* Desktop only: section heading */}
        <div className="mb-8 hidden w-full md:block" style={{ maxWidth: 360 }}>
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
              margin: "0 0 4px",
            }}
          >
            Bienvenido
          </p>
          <p
            style={{
              fontSize: 14,
              color: "var(--fg-2)",
              fontFamily: "var(--font-sans)",
              margin: 0,
            }}
          >
            Ingresá para gestionar los gastos del mes
          </p>
        </div>

        {/* CTA — always visible */}
        <div className="w-full" style={{ maxWidth: 360 }}>
          <button
            type="button"
            onClick={signInWithGoogle}
            style={{
              width: "100%",
              background: "var(--bg-elevated)",
              border: "1.5px solid var(--border-default)",
              borderRadius: 14,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              fontFamily: "var(--font-sans)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--fg-1)",
            }}
          >
            <GoogleIcon />
            Continuar con Google
          </button>
          <p
            style={{
              textAlign: "center",
              marginTop: 14,
              fontSize: 12,
              color: "var(--fg-3)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Al continuar aceptás los términos de uso
          </p>

          {IS_DEV && (
            <form
              onSubmit={signInWithEmail}
              style={{
                marginTop: 24,
                padding: "16px",
                background: "var(--bg-elevated)",
                border: "1.5px dashed var(--border-default)",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-sans)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Dev — seed users
              </div>
              <label htmlFor="dev-email" className="sr-only">
                Email
              </label>
              <input
                id="dev-email"
                type="email"
                placeholder="persona_a@test.local"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                required
                autoComplete="email"
                spellCheck={false}
                style={{
                  border: "1px solid var(--border-default)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 14,
                  fontFamily: "var(--font-sans)",
                  background: "var(--bg-sunken)",
                  color: "var(--fg-1)",
                  outline: "none",
                }}
              />
              <label htmlFor="dev-password" className="sr-only">
                Contraseña
              </label>
              <input
                id="dev-password"
                type="password"
                placeholder="password123"
                value={devPassword}
                onChange={(e) => setDevPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  border: "1px solid var(--border-default)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 14,
                  fontFamily: "var(--font-sans)",
                  background: "var(--bg-sunken)",
                  color: "var(--fg-1)",
                  outline: "none",
                }}
              />
              {devError && (
                <div
                  role="alert"
                  style={{
                    fontSize: 12,
                    color: "var(--status-danger-text)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {devError}
                </div>
              )}
              <button
                type="submit"
                disabled={devLoading}
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  cursor: devLoading ? "not-allowed" : "pointer",
                  opacity: devLoading ? 0.7 : 1,
                }}
              >
                {devLoading ? "Entrando…" : "Entrar"}
              </button>
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
