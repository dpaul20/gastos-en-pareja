"use client";

import { useMemo } from "react";

const COLORS = [
  "var(--color-violet-400)",
  "var(--color-teal-400)",
  "var(--color-amber-400)",
  "var(--color-coral-400)",
  "var(--color-violet-200)",
];

/** One-shot CSS confetti burst; renders nothing under reduced motion (CSS-gated). */
export function Confetti({ count = 26 }: { readonly count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // deterministic spread so SSR/CSR match and no randomness lint issues
        const t = (i * 137.5) % 360;
        const rad = (t * Math.PI) / 180;
        return {
          left: 50 + Math.cos(rad) * 8,
          dx: Math.round(Math.cos(rad) * (90 + (i % 5) * 28)),
          dy: Math.round(120 + ((i * 37) % 140)),
          rot: 180 + ((i * 53) % 540),
          color: COLORS[i % COLORS.length],
          w: 6 + (i % 3) * 2,
        };
      }),
    [count],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-20 z-10 h-0"
    >
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-bit absolute block rounded-[2px] opacity-0"
          style={
            {
              left: `${b.left}%`,
              width: b.w,
              height: b.w * 1.6,
              background: b.color,
              "--i": i,
              "--dx": `${b.dx}px`,
              "--dy": `${b.dy}px`,
              "--rot": `${b.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
