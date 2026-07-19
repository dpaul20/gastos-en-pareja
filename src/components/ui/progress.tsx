"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  max = 100,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  // Radix's own `aria-valuenow`/`aria-valuemax` are derived straight from
  // `value`/`max` (see @radix-ui/react-progress), so callers that need a
  // non-percentage semantic value (e.g. "3 of 12 installments") pass the raw
  // value + max here — the indicator width must therefore be computed as a
  // percentage of `max`, not assumed to already be 0-100.
  const percentage = max > 0 ? ((value ?? 0) / max) * 100 : 0;
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
