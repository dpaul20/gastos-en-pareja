"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly destructive?: boolean;
  readonly onConfirm: () => void;
}

// ── SUB-COMPONENTS ───

interface DialogBodyProps {
  readonly description: string;
  readonly confirmLabel: string;
  readonly destructive: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

function DialogBody({
  description,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: DialogBodyProps) {
  return (
    <>
      <p
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--fg-2)",
          lineHeight: "var(--leading-normal)",
          marginBottom: 24,
        }}
      >
        {description}
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
        }}
      >
        <Button variant="ghost" onClick={onCancel} autoFocus>
          Cancelar
        </Button>
        <Button
          variant={destructive ? "destructive" : "default"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}

// ── CONFIRM DIALOG ───

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const isMobile = useIsMobile();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-describedby={undefined}
          className={cn(
            "pb-safe-mobile mx-auto w-full max-w-120 rounded-t-[20px]",
          )}
          style={{
            background: "var(--bg-elevated)",
            border: "none",
            padding: "20px 20px 24px",
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
          <DialogBody
            description={description}
            confirmLabel={confirmLabel}
            destructive={destructive}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
          style={{ background: "var(--bg-overlay)" }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-md overflow-y-auto rounded-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-xl)",
            padding: "28px 24px 32px",
            maxHeight: "85vh",
          }}
        >
          <DialogPrimitive.Title
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
              marginBottom: 12,
            }}
          >
            {title}
          </DialogPrimitive.Title>
          <DialogBody
            description={description}
            confirmLabel={confirmLabel}
            destructive={destructive}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
