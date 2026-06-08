"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ResponsiveModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly children: React.ReactNode;
  readonly "data-testid"?: string;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  children,
  "data-testid": testId,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-describedby={undefined}
          data-testid={testId}
          className="pb-safe-mobile mx-auto w-full max-w-120 rounded-t-[20px]"
          style={{
            background: "var(--bg-elevated)",
            border: "none",
            padding: "20px 20px 0",
          }}
        >
          <div
            aria-hidden
            style={{
              width: 36,
              height: 4,
              borderRadius: 99,
              background: "var(--border-default)",
              margin: "0 auto 20px",
            }}
          />
          <SheetHeader style={{ marginBottom: 16 }}>
            <SheetTitle
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--fg-1)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {title}
            </SheetTitle>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          data-testid={testId}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-120 overflow-y-auto rounded-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            padding: "28px 24px 32px",
            maxHeight: "85vh",
          }}
        >
          <DialogPrimitive.Close
            className="absolute top-4 right-4 rounded-md opacity-60 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none"
            style={{ color: "var(--fg-2)" }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </DialogPrimitive.Close>
          <DialogPrimitive.Title
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
              marginBottom: 20,
              paddingRight: 28,
            }}
          >
            {title}
          </DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
