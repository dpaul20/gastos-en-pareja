"use client";

import * as React from "react";
import { ToastContext } from "./toast-provider";

const DEFAULT_DURATION = 4000;

function generateId(): string {
  return `toast-${Math.random().toString(36).slice(2, 9)}-${Date.now()}`;
}

interface UndoOptions {
  label?: string;
  onUndo: () => void;
}

interface DangerOptions {
  undo?: UndoOptions;
  duration?: number;
}

interface ToastApi {
  success: (title: string) => void;
  danger: (title: string, opts?: DangerOptions) => void;
}

export function useToast(): { toast: ToastApi } {
  const ctx = React.useContext(ToastContext);

  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const { dispatch } = ctx;

  const toast: ToastApi = React.useMemo(
    () => ({
      success(title: string) {
        const id = generateId();
        dispatch({
          type: "ADD_TOAST",
          toast: { id, variant: "success", title },
        });
        setTimeout(
          () => dispatch({ type: "DISMISS_TOAST", id }),
          DEFAULT_DURATION,
        );
      },

      danger(title: string, opts?: DangerOptions) {
        const id = generateId();
        const duration = opts?.duration ?? DEFAULT_DURATION;

        let timerId: ReturnType<typeof setTimeout> | null = null;

        const undo = opts?.undo
          ? {
              label: opts.undo.label ?? "Deshacer",
              onUndo: () => {
                if (timerId !== null) {
                  clearTimeout(timerId);
                  timerId = null;
                }
                opts.undo!.onUndo();
                dispatch({ type: "DISMISS_TOAST", id });
              },
            }
          : undefined;

        dispatch({
          type: "ADD_TOAST",
          toast: { id, variant: "danger", title, undo },
        });

        timerId = setTimeout(
          () => dispatch({ type: "DISMISS_TOAST", id }),
          duration,
        );
      },
    }),
    [dispatch],
  );

  return { toast };
}
