"use client";

import { useEffect } from "react";

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("App render error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: "100%",
          border: "1px solid var(--border-subtle)",
          borderRadius: 16,
          background: "var(--bg-elevated)",
          boxShadow: "var(--shadow-sm)",
          padding: "20px",
          fontFamily: "var(--font-sans)",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 10, color: "var(--fg-1)" }}>
          Ocurrió un error al cargar esta pantalla
        </h2>
        <p style={{ marginTop: 0, marginBottom: 12, color: "var(--fg-2)" }}>
          Si el problema persiste, compartí el código de diagnóstico con
          soporte.
        </p>
        <p style={{ marginTop: 0, marginBottom: 16, color: "var(--fg-3)" }}>
          Digest: {error.digest ?? "no-disponible"}
        </p>

        <button
          type="button"
          onClick={() => reset()}
          style={{
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "10px 14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
