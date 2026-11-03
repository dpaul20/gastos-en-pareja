import * as React from "react";

interface PageHeaderProps {
  readonly title: string;
  readonly eyebrow?: string;
  readonly subtitle?: React.ReactNode;
  readonly trailing?: React.ReactNode;
  /** Extra row under the title (tabs, filters…). */
  readonly children?: React.ReactNode;
}

/** Sticky glass header with a large title; the single h1 of each screen. */
export function PageHeader({
  title,
  eyebrow,
  subtitle,
  trailing,
  children,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-end justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow mb-0.5">{eyebrow}</div>}
            <h1 className="m-0 [font-family:var(--font-sans)] text-[26px] leading-[1.1] font-bold tracking-[-0.02em] [color:var(--fg-1)]">
              {title}
            </h1>
            {subtitle && (
              <p className="m-0 mt-1 [font-family:var(--font-sans)] text-[13px] [color:var(--fg-2)]">
                {subtitle}
              </p>
            )}
          </div>
          {trailing && <div className="shrink-0">{trailing}</div>}
        </div>
        {children}
      </div>
    </header>
  );
}
