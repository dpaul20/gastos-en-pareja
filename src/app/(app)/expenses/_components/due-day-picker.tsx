"use client";

import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// Re-skin matching the original hand-rolled aspect-square mono grid exactly.
const dayToggleItemClassName = cn(
  "aspect-square h-auto w-full min-w-0 rounded-[var(--radius-sm)] p-0",
  "text-[13px] [font-family:var(--font-mono)]",
  "transition-[background-color,border-color,color] duration-150",
  "data-[state=off]:border data-[state=off]:font-medium",
  "data-[state=off]:[background-color:var(--bg-elevated)] data-[state=off]:[border-color:var(--border-subtle)] data-[state=off]:[color:var(--fg-2)]",
  "data-[state=off]:hover:[background-color:var(--bg-elevated)] data-[state=off]:hover:[color:var(--fg-2)]",
  "data-[state=on]:border-[1.5px] data-[state=on]:font-bold",
  "data-[state=on]:[background-color:var(--accent)] data-[state=on]:[border-color:var(--accent)] data-[state=on]:[color:var(--accent-foreground)]",
  "data-[state=on]:hover:[background-color:var(--accent)] data-[state=on]:hover:[color:var(--accent-foreground)]",
);

export function DueDayPicker({
  value,
  onChange,
}: {
  readonly value: number | null;
  readonly onChange: (day: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 [font-family:var(--font-sans)] text-xs [color:var(--fg-3)]">
        Se repite todos los meses el día{" "}
        <strong className="[font-family:var(--font-mono)] font-bold [color:var(--fg-1)]">
          {value ?? "—"}
        </strong>
      </div>
      <ToggleGroup
        type="single"
        spacing={1}
        value={value != null ? String(value) : ""}
        onValueChange={(next) => {
          // Radix fires "" when re-clicking the already-active item
          // (deselect). This picker has no deselect affordance in the
          // original (onChange only ever receives a number) — ignore.
          if (!next) return;
          onChange(Number(next));
        }}
        aria-label="Día de vencimiento"
        className="grid w-full grid-cols-7 gap-1 rounded-none border-0 bg-transparent p-0"
      >
        {DAYS.map((day) => (
          <ToggleGroupItem
            key={day}
            value={String(day)}
            aria-label={`Día ${day}`}
            className={dayToggleItemClassName}
          >
            {day}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
