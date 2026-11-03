"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CloudOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";

type Phase = "hidden" | "offline" | "restored";

const RESTORED_VISIBLE_MS = 2600;

/**
 * Ambient connection pill: appears when the network drops, and when it comes
 * back it says so briefly and revalidates every query.
 */
export function ConnectionStatus() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function handleOnline() {
      setRestored(true);
      void queryClient.invalidateQueries();
      clearTimeout(timer);
      timer = setTimeout(() => setRestored(false), RESTORED_VISIBLE_MS);
    }
    function handleOffline() {
      clearTimeout(timer);
      setRestored(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  let phase: Phase = "hidden";
  if (!online) phase = "offline";
  else if (restored) phase = "restored";
  if (phase === "hidden") return null;

  const isOffline = phase === "offline";
  const Icon = isOffline ? CloudOff : Wifi;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="connection-status"
      data-state={phase}
      className="connection-pill"
    >
      <Icon size={14} aria-hidden="true" />
      <span>
        {isOffline
          ? "Sin conexión · tus datos están a salvo"
          : "Volviste a estar en línea"}
      </span>
    </div>
  );
}
