import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        // ── App variants ──────────────────────────────────────
        success:
          "[background-color:var(--status-success-subtle)] [color:var(--status-success-text)]",
        danger:
          "[background-color:var(--status-danger-subtle)] [color:var(--status-danger-text)]",
        warning:
          "[background-color:var(--status-warning-subtle)] [color:var(--status-warning-fg)]",
        neutral:
          "[background-color:var(--color-neutral-100)] [color:var(--fg-2)]",
        accent: "[background-color:var(--accent-subtle)] [color:var(--accent)]",
        // Micro-tags (pair with size="sm"): the squared inline pills that
        // used to be hand-rolled <span>s across the expense items.
        personal:
          "[background-color:var(--bg-sunken)] [color:var(--fg-3)] [border-color:var(--border-subtle)] uppercase tracking-[0.05em]",
        editado:
          "[background-color:color-mix(in_srgb,var(--accent)_12%,transparent)] [color:var(--accent)]",
        // "sin factura" pending pill (fijo-item AWAITING_BILL row): dashed
        // outline, no fill — pair with `className="text-[10px] font-bold"`
        // (default size's `text-xs font-medium` is 12px/500, not 10px/700).
        "sin-factura":
          "[color:var(--status-pending)] [border-color:var(--status-pending)] border-dashed bg-transparent",
      },
      size: {
        default: "",
        // Small squared tag: 10px, tighter padding, sharp corners.
        sm: "rounded-sm px-1.5 py-px text-[10px] font-semibold",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
