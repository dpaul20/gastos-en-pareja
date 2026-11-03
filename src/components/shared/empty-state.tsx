import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  readonly label: string;
  readonly href?: string;
  readonly onClick?: () => void;
}

interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description?: string;
  readonly action?: EmptyStateAction;
  readonly tone?: "accent" | "success" | "neutral";
  readonly className?: string;
  readonly "data-testid"?: string;
}

const TONES = {
  accent: { fg: "var(--accent)", bg: "var(--accent-subtle)" },
  success: {
    fg: "var(--status-success-text)",
    bg: "var(--status-success-subtle)",
  },
  neutral: { fg: "var(--fg-2)", bg: "var(--bg-sunken)" },
} as const;

const ACTION_CLASS =
  "press mt-5 inline-flex h-11 items-center justify-center rounded-full [background-color:var(--accent)] px-6 [font-family:var(--font-sans)] text-sm font-semibold [color:var(--accent-foreground)] no-underline shadow-[var(--shadow-accent)]";

/** Friendly placeholder with a softly floating icon tile and one clear next step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "accent",
  className,
  "data-testid": testId,
}: EmptyStateProps) {
  const t = TONES[tone];
  return (
    <div
      data-testid={testId}
      className={cn(
        "rise-in flex flex-col items-center px-6 py-12 text-center",
        className,
      )}
    >
      <div className="relative mb-5 size-24" aria-hidden>
        <span
          className="drift absolute inset-0 rounded-[32px] opacity-60 blur-xl"
          style={{ background: t.bg }}
        />
        <span
          className="float-y absolute top-1 left-0 size-14 rounded-2xl opacity-70"
          style={{ background: t.bg, ["--r" as string]: "-12deg" }}
        />
        <span
          className="float-y absolute right-0 bottom-1 size-10 rounded-xl opacity-60"
          style={{
            background: t.bg,
            ["--r" as string]: "14deg",
            ["--i" as string]: 2,
          }}
        />
        <span
          className="pop-in absolute inset-3 flex items-center justify-center rounded-[26px] shadow-[var(--shadow-md)]"
          style={{ background: "var(--bg-elevated)", color: t.fg }}
        >
          <Icon size={32} strokeWidth={1.8} />
        </span>
      </div>
      <h2 className="m-0 [font-family:var(--font-sans)] text-[18px] font-bold tracking-tight [color:var(--fg-1)]">
        {title}
      </h2>
      {description && (
        <p className="m-0 mt-1.5 max-w-[280px] [font-family:var(--font-sans)] text-sm leading-relaxed [color:var(--fg-2)]">
          {description}
        </p>
      )}
      {action &&
        (action.href ? (
          <Link href={action.href} className={ACTION_CLASS}>
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className={ACTION_CLASS}
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
