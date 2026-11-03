"use client";

import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/shared/confetti";
import { haptic } from "@/lib/feedback/notify";

interface SettledCelebrationProps {
  readonly settled: boolean;
}

/** Bursts confetti only when `settled` flips false → true, never on first load. */
export function SettledCelebration({
  settled,
}: Readonly<SettledCelebrationProps>) {
  const previous = useRef(settled);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (settled && !previous.current) {
      haptic("celebrate");
      setBurst((n) => n + 1);
    }
    previous.current = settled;
  }, [settled]);

  return burst > 0 ? <Confetti key={burst} /> : null;
}
