interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "danger" | "warning" | "neutral" | "accent";
}

const styles = {
  success: {
    bg: "var(--status-success-subtle)",
    color: "var(--status-success)",
  },
  danger: { bg: "var(--status-danger-subtle)", color: "var(--status-danger)" },
  warning: { bg: "var(--color-amber-50)", color: "#D97706" },
  neutral: { bg: "var(--color-neutral-100)", color: "var(--fg-2)" },
  accent: { bg: "var(--accent-subtle)", color: "var(--accent)" },
};

export function Badge({ children, variant = "neutral" }: Readonly<BadgeProps>) {
  const s = styles[variant];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 9999,
        padding: "3px 9px",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
