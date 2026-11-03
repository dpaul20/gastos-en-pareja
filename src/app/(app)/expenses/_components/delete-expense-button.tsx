"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useAction } from "@/lib/hooks/use-action";
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

  const { run: runUndo } = useAction((undo: () => Promise<void>) => undo(), {
    errorTitle: "No pudimos deshacer",
    invalidate: [["monthly-data"]],
    success: "Listo, lo restauramos",
  });

  const { run: runDelete, pending: isPending } = useAction(onConfirm, {
    errorTitle: "No pudimos eliminarlo",
    invalidate: [["monthly-data"]],
    success: (undo) => ({
      title: successMessage,
      action: undo
        ? { label: "Deshacer", onClick: () => void runUndo(undo) }
        : undefined,
    }),
  });

  function handleConfirm() {
    void runDelete();
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
