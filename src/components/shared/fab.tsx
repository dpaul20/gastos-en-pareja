"use client";

import { Button } from "@/components/ui/button";

interface FABProps {
  onClick: () => void;
  label?: string;
}

export function FAB({ onClick, label = "Agregar" }: Readonly<FABProps>) {
  return (
    <Button
      onClick={onClick}
      aria-label={label}
      size="icon"
      style={{
        position: "fixed",
        bottom: `calc(var(--bottom-nav-height) + 16px)`,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 9999,
        backgroundColor: "var(--accent)",
        boxShadow: "var(--shadow-accent)",
        zIndex: 90,
        fontSize: 28,
        fontWeight: 300,
      }}
    >
      +
    </Button>
  );
}
