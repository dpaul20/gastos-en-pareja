"use client";

interface MonthHeaderProps {
  month: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext?: boolean;
}

export function MonthHeader({
  month,
  onPrev,
  onNext,
  canGoNext = true,
}: Readonly<MonthHeaderProps>) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px 10px",
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <button
        onClick={onPrev}
        style={{
          background: "none",
          border: "none",
          padding: 6,
          cursor: "pointer",
          borderRadius: 8,
          minWidth: 44,
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Mes anterior"
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--fg-2)"
          strokeWidth="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: "var(--fg-1)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {month}
      </span>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        style={{
          background: "none",
          border: "none",
          padding: 6,
          cursor: canGoNext ? "pointer" : "default",
          borderRadius: 8,
          minWidth: 44,
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: canGoNext ? 1 : 0.3,
        }}
        aria-label="Mes siguiente"
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--fg-2)"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
