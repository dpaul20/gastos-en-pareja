"use client";

import * as React from "react";
import { Toaster } from "@/components/ui/sonner";
import { ConnectionStatus } from "@/components/shared/connection-status";

interface AppShellProps {
  readonly children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      {children}
      <ConnectionStatus />
      <Toaster />
    </>
  );
}
