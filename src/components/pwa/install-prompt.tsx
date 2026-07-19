"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    globalThis.addEventListener("beforeinstallprompt", handler);
    return () => globalThis.removeEventListener("beforeinstallprompt", handler);
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
    <Card className="fixed right-4 bottom-[calc(var(--bottom-nav-height)_+_12px)] left-4 z-[80] mx-auto max-w-[358px]">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-[10px]"
          style={{
            background:
              "linear-gradient(135deg, var(--color-violet-500) 0%, var(--color-violet-400) 100%)",
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
        <div className="flex-1">
          <div className="[font-family:var(--font-sans)] text-[13px] font-semibold [color:var(--fg-1)]">
            Instalá la app
          </div>
          <div className="[font-family:var(--font-sans)] text-[11px] [color:var(--fg-3)]">
            Acceso rápido desde tu pantalla de inicio
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDismissed(true)}
          aria-label="Cerrar"
          className="min-h-8 min-w-8 [color:var(--fg-3)]"
        >
          ×
        </Button>
        <Button size="sm" onClick={handleInstall} className="whitespace-nowrap">
          Instalar
        </Button>
      </CardContent>
    </Card>
  );
}
