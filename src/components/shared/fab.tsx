"use client";

interface FABProps {
  onClick: () => void;
  label?: string;
}

export function FAB({ onClick, label = "Agregar" }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        position: "fixed",
        bottom: `calc(var(--bottom-nav-height) + 16px)`,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 9999,
        background: "var(--accent)",
        border: "none",
        color: "white",
        fontSize: 28,
        fontWeight: 300,
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(108,92,231,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 90,
        transition: "transform 150ms",
      }}
    >
      +
    </button>
  );
}
