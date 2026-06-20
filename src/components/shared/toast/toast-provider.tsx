"use client";

import * as React from "react";
import { Toaster } from "./toaster";

export interface Toast {
  id: string;
  variant: "success" | "danger";
  title: string;
  undo?: {
    label: string;
    onUndo: () => void;
  };
}

export interface ToastState {
  toasts: Toast[];
}

export type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "DISMISS_TOAST"; id: string };

export function toastReducer(
  state: ToastState,
  action: ToastAction,
): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return { toasts: [...state.toasts, action.toast] };
    case "DISMISS_TOAST":
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

interface ToastContextValue {
  dispatch: React.Dispatch<ToastAction>;
  toasts: Toast[];
}

export const ToastContext = React.createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  readonly children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] });

  const value = React.useMemo(
    () => ({ dispatch, toasts: state.toasts }),
    [dispatch, state.toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}
