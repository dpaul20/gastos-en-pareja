"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastContext, type Toast } from "./toast-provider";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// ── SUB-COMPONENTS ───

interface ToastItemProps {
  readonly toast: Toast;
  readonly onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const isSuccess = toast.variant === "success";

  const sharedStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-md)",
    minWidth: 240,
    maxWidth: 360,
    animation: "toast-slide-in var(--duration-normal) var(--ease-out) both",
  };

  const inner = (
    <>
      {isSuccess ? (
        <CheckCircle
          size={18}
          aria-hidden
          style={{ flexShrink: 0, color: "var(--status-success-text)" }}
        />
      ) : (
        <AlertCircle
          size={18}
          aria-hidden
          style={{ flexShrink: 0, color: "var(--status-danger-text)" }}
        />
      )}
      <span
        style={{
          flex: 1,
          fontSize: "var(--text-sm)",
          fontWeight: "var(--weight-medium)",
          color: "var(--fg-1)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {toast.title}
      </span>
      {toast.undo && (
        <button
          onClick={() => toast.undo?.onUndo()}
          style={{
            flexShrink: 0,
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--accent)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
          }}
        >
          {toast.undo.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        style={{
          flexShrink: 0,
          color: "var(--fg-3)",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: 2,
        }}
      >
        <X size={14} aria-hidden />
      </button>
    </>
  );

  if (isSuccess) {
    return (
      <output
        aria-live="polite"
        className={cn("toast-item")}
        style={sharedStyle}
      >
        {inner}
      </output>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn("toast-item")}
      style={sharedStyle}
    >
      {inner}
    </div>
  );
}

// ── TOASTER ───

export function Toaster() {
  const ctx = React.useContext(ToastContext);
  const isClient = useIsClient();

  if (!ctx || !isClient) return null;

  const { toasts, dispatch } = ctx;

  const handleDismiss = (id: string) => {
    dispatch({ type: "DISMISS_TOAST", id });
  };

  return createPortal(
    <>
      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .toast-item { animation: none !important; }
        }
      `}</style>
      <div
        aria-label="Notifications"
        style={{
          position: "fixed",
          bottom: "calc(var(--bottom-nav-height, 0px) + 16px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
          pointerEvents: toasts.length === 0 ? "none" : "auto",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={handleDismiss} />
        ))}
      </div>
    </>,
    document.body,
  );
}
