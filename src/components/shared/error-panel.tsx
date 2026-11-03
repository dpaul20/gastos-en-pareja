"use client";

import { useState } from "react";
import { RefreshCw, TriangleAlert, Copy, Check } from "lucide-react";

interface ErrorPanelProps {
  readonly digest?: string;
  readonly onRetry: () => void;
}

export function ErrorPanel({ digest, onRetry }: ErrorPanelProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!digest) return;
    try {
      await navigator.clipboard.writeText(digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; the code stays visible on screen.
    }
  }

  return (
    <div
      role="alert"
      data-testid="error-panel"
      className="rise-in glass w-full max-w-[420px] rounded-3xl p-6 text-center [font-family:var(--font-sans)]"
    >
      <div
        className="float-y mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl [background-color:var(--status-danger-subtle)] [color:var(--status-danger-text)]"
        aria-hidden="true"
      >
        <TriangleAlert size={30} />
      </div>
      <h2 className="m-0 mb-2 text-lg font-semibold [color:var(--fg-1)]">
        Algo no salió como esperábamos
      </h2>
      <p className="m-0 mb-5 text-sm [color:var(--fg-2)]">
        Tus datos están a salvo. Probá de nuevo y, si sigue pasando, mandanos el
        código de abajo.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="press inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-none [background-color:var(--accent)] px-4 font-semibold [color:var(--accent-foreground)] shadow-[var(--shadow-accent)]"
      >
        <RefreshCw size={16} aria-hidden="true" />
        Reintentar
      </button>

      {digest && (
        <button
          type="button"
          onClick={copy}
          className="mt-3 inline-flex min-h-9 cursor-pointer items-center gap-1.5 border-none bg-transparent px-2 text-xs [color:var(--fg-3)]"
        >
          {copied ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Copy size={14} aria-hidden="true" />
          )}
          {copied ? "Código copiado" : `Copiar código · ${digest}`}
        </button>
      )}
    </div>
  );
}
