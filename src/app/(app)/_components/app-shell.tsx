"use client";

import * as React from "react";
import { ToastProvider } from "@/components/shared/toast/toast-provider";

interface AppShellProps {
  readonly children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return <ToastProvider>{children}</ToastProvider>;
}
