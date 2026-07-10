"use client";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function DueDayPicker({
  value,
  onChange,
}: {
  readonly value: number | null;
  readonly onChange: (day: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "var(--fg-3)",
          marginBottom: 8,
          fontFamily: "var(--font-sans)",
        }}
      >
        Se repite todos los meses el día{" "}
        <strong
          style={{
            color: "var(--fg-1)",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
          }}
        >
          {value ?? "—"}
        </strong>
      </div>
      <fieldset style={{ border: 0, margin: 0, padding: 0, minInlineSize: 0 }}>
        <legend className="sr-only">Día de vencimiento</legend>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
          }}
        >
          {DAYS.map((day) => {
            const selected = value === day;
            return (
              <button
                key={day}
                type="button"
                aria-pressed={selected}
                aria-label={`Día ${day}`}
                onClick={() => onChange(day)}
                style={{
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: selected ? 700 : 500,
                  background: selected ? "var(--accent)" : "var(--bg-elevated)",
                  color: selected ? "var(--accent-foreground)" : "var(--fg-2)",
                  border: selected
                    ? "1.5px solid var(--accent)"
                    : "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  transition:
                    "background-color 150ms, border-color 150ms, color 150ms",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
