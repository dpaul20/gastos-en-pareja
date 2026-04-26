"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(var(--bottom-nav-height) + 12px)",
        left: 16,
        right: 16,
        maxWidth: 358,
        margin: "0 auto",
        background: "var(--bg-elevated)",
        borderRadius: 16,
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-md)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        zIndex: 80,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          flexShrink: 0,
          background: "linear-gradient(135deg, #6C5CE7 0%, #8B79FA 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          Instalá la app
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--fg-3)",
            fontFamily: "var(--font-sans)",
          }}
        >
          Acceso rápido desde tu pantalla de inicio
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          color: "var(--fg-3)",
          fontSize: 18,
          minWidth: 32,
          minHeight: 32,
        }}
        aria-label="Cerrar"
      >
        ×
      </button>
      <button
        onClick={handleInstall}
        style={{
          background: "var(--accent)",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "6px 14px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
          whiteSpace: "nowrap",
          minHeight: 32,
        }}
      >
        Instalar
      </button>
    </div>
  );
}
