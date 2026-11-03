"use client";

import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
  label?: string;
}

/** Floating add button: sits above the dock, with a gentle attention ring. */
export function FAB({ onClick, label = "Agregar" }: Readonly<FABProps>) {
  return (
    <button
      type="button"
      onClick={() => {
        if ("vibrate" in navigator) navigator.vibrate(10);
        onClick();
      }}
      aria-label={label}
      className="press ring-pulse group fixed z-[90] flex size-14 items-center justify-center rounded-full border-none text-white lg:right-8 lg:bottom-8"
      style={{
        bottom: "calc(var(--bottom-nav-height) + 8px)",
        right: 20,
        backgroundImage:
          "linear-gradient(135deg, var(--color-violet-500), var(--color-violet-700))",
        boxShadow: "var(--shadow-accent)",
      }}
    >
      <Plus
        size={26}
        strokeWidth={2.4}
        aria-hidden="true"
        className="transition-transform duration-300 [transition-timing-function:var(--ease-spring)] group-hover:rotate-90"
      />
    </button>
  );
}
