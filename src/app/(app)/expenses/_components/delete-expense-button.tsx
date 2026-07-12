"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface DeleteExpenseButtonProps {
  /** Confirmation dialog title, e.g. "¿Eliminar gasto?" */
  readonly title: string;
  /** Confirmation dialog body copy. */
  readonly description: string;
  /** Toast shown after a successful delete. */
  readonly successMessage: string;
  /**
   * Performs the delete. Optionally returns an undo callback that restores
   * what was deleted — when present, the toast offers a "Deshacer" action.
   */
  readonly onConfirm: () => Promise<(() => Promise<void>) | void>;
  /** Render just the trash icon (no "Eliminar" label) — for dense rows. */
  readonly iconOnly?: boolean;
}

export function DeleteExpenseButton({
  title,
  description,
  successMessage,
  onConfirm,
  iconOnly = false,
}: DeleteExpenseButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function runUndo(undo: () => Promise<void>) {
    startTransition(async () => {
      await undo();
      queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
    });
  }

  function handleConfirm() {
    startTransition(async () => {
      const undo = await onConfirm();
      queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
      toast.success(
        successMessage,
        undo
          ? { action: { label: "Deshacer", onClick: () => runUndo(undo) } }
          : undefined,
      );
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        aria-label={title}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: iconOnly ? 6 : "4px 8px",
          color: "var(--fg-3)",
          fontSize: 12,
          fontFamily: "var(--font-sans)",
          flexShrink: 0,
          opacity: isPending ? 0.5 : 1,
        }}
      >
        <Trash2 size={iconOnly ? 16 : 14} aria-hidden="true" />
        {!iconOnly && "Eliminar"}
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel="Sí, eliminar"
        destructive
        onConfirm={handleConfirm}
      />
    </>
  );
}
