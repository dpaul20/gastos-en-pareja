"use client";

import * as React from "react";
import { Toaster } from "@/components/ui/sonner";

interface AppShellProps {
  readonly children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      {children}
      <Toaster position="bottom-center" />
    </>
  );
}
