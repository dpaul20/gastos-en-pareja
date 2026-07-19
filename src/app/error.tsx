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
    <div className="flex min-h-dvh items-center justify-center [background-color:var(--bg-base)] p-6">
      <div className="w-full max-w-[460px] rounded-[var(--radius-lg)] border [border-color:var(--border-subtle)] [background-color:var(--bg-elevated)] p-5 [font-family:var(--font-sans)] shadow-[var(--shadow-sm)]">
        <h2 className="m-0 mb-2.5 [color:var(--fg-1)]">
          Ocurrió un error al cargar esta pantalla
        </h2>
        <p className="mt-0 mb-3 [color:var(--fg-2)]">
          Si el problema persiste, compartí el código de diagnóstico con
          soporte.
        </p>
        <p className="mt-0 mb-4 [color:var(--fg-3)]">
          Digest: {error.digest ?? "no-disponible"}
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="cursor-pointer rounded-[10px] border-none [background-color:var(--accent)] px-3.5 py-2.5 font-semibold text-white"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
