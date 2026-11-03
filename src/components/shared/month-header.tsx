"use client";

import { ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthHeaderProps {
  month: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext?: boolean;
  /** Small line above the month, e.g. a greeting. */
  eyebrow?: string;
  /** Shown as a "Hoy" shortcut when browsing a month other than the current one. */
  onToday?: () => void;
}

const ARROW_CLASS =
  "press flex size-11 items-center justify-center rounded-full border-none bg-transparent [color:var(--fg-2)] hover:[background-color:var(--bg-sunken)] disabled:pointer-events-none disabled:opacity-30";

export function MonthHeader({
  month,
  onPrev,
  onNext,
  canGoNext = true,
  eyebrow,
  onToday,
}: Readonly<MonthHeaderProps>) {
  return (
    <div className="page-header">
      <div className="mx-auto w-full max-w-3xl px-3 pt-3 pb-2.5">
        {eyebrow && (
          <div className="eyebrow rise-in px-3 pb-1 text-center normal-case">
            {eyebrow}
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onPrev}
            className={ARROW_CLASS}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={22} strokeWidth={2.2} aria-hidden />
          </button>
          <div className="flex min-w-0 flex-col items-center">
            <span
              key={month}
              data-testid="current-month"
              className="rise-in [font-family:var(--font-sans)] text-[20px] leading-tight font-bold tracking-[-0.015em] [color:var(--fg-1)]"
            >
              {month}
            </span>
            {onToday && (
              <button
                type="button"
                onClick={onToday}
                className={cn(
                  "pop-in press mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 [font-family:var(--font-sans)] text-[11px] font-semibold",
                  "[background-color:var(--accent-subtle)] [color:var(--accent)]",
                )}
              >
                <CalendarCheck size={12} aria-hidden />
                Volver a hoy
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className={ARROW_CLASS}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={22} strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
