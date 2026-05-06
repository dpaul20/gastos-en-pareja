export function NewInstancesBanner({
  count,
  onDismiss,
}: {
  readonly count: number;
  readonly onDismiss: () => void;
}) {
  if (count === 0) return null;
  const plural = count > 1;
  return (
    <div
      style={{
        background: "var(--status-success-subtle)",
        borderRadius: 12,
        padding: "10px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: "var(--status-success)",
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
        }}
      >
        ✓ {count} gasto{plural ? "s" : ""} fijo{plural ? "s" : ""} generado
        {plural ? "s" : ""} para este mes
      </span>
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--status-success)",
          fontSize: 16,
          padding: 2,
        }}
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
}
