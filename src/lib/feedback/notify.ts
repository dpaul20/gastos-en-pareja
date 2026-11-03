"use client";

import { toast } from "sonner";
import type { ErrorDescription } from "@/lib/utils/describe-error";

type Haptic = "success" | "warning" | "error" | "celebrate";

const HAPTIC_PATTERNS: Record<Haptic, number | number[]> = {
  success: 12,
  warning: [16, 40, 16],
  error: [28, 50, 28],
  celebrate: [10, 30, 10, 30, 24],
};

export function haptic(kind: Haptic): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(HAPTIC_PATTERNS[kind]);
}

interface NotifyAction {
  readonly label: string;
  readonly onClick: () => void | Promise<void>;
}

interface NotifyOptions {
  readonly description?: string;
  readonly action?: NotifyAction;
  readonly duration?: number;
  readonly id?: string | number;
}

function toAction(action?: NotifyAction) {
  return action
    ? { label: action.label, onClick: () => void action.onClick() }
    : undefined;
}

async function copyCode(code: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(code);
    toast.success("Código copiado", { duration: 1800 });
  } catch {
    toast.info(`Código: ${code}`, { duration: 6000 });
  }
}

/** The single channel for every transient message in the app. */
export const notify = {
  success(title: string, options: NotifyOptions = {}) {
    haptic("success");
    return toast.success(title, {
      description: options.description,
      action: toAction(options.action),
      duration: options.duration ?? 4000,
      id: options.id,
    });
  },

  /** Success with extra flourish — reserved for moments that close a loop. */
  celebrate(title: string, options: NotifyOptions = {}) {
    haptic("celebrate");
    return toast.success(title, {
      description: options.description,
      duration: options.duration ?? 5000,
      id: options.id,
      className: "fx-toast-celebrate",
    });
  },

  info(title: string, options: NotifyOptions = {}) {
    return toast.info(title, {
      description: options.description,
      action: toAction(options.action),
      duration: options.duration ?? 4000,
      id: options.id,
    });
  },

  warning(title: string, options: NotifyOptions = {}) {
    haptic("warning");
    return toast.warning(title, {
      description: options.description,
      action: toAction(options.action),
      duration: options.duration ?? 6000,
      id: options.id,
    });
  },

  /**
   * Shows a classified error. Retryable errors offer "Reintentar"; errors
   * that carry a digest offer "Copiar código" so support can find the log.
   */
  error(
    error: ErrorDescription,
    options: { onRetry?: () => void | Promise<void> } = {},
  ) {
    haptic("error");
    const { onRetry } = options;
    const retry =
      error.retryable && onRetry
        ? { label: "Reintentar", onClick: () => void onRetry() }
        : undefined;
    const code = error.code;
    return toast.error(error.title, {
      description: error.message || undefined,
      action: retry,
      cancel: code
        ? { label: "Copiar código", onClick: () => void copyCode(code) }
        : undefined,
      duration: 9000,
    });
  },

  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
};
