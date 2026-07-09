import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function NewInstancesBanner({
  count,
  onDismiss,
}: {
  readonly count: number;
  readonly onDismiss: () => void;
}) {
  if (count === 0) return null;
  const plural = count > 1;
  return (
    <Alert className="mb-3 flex items-center justify-between gap-2 border-(--status-success-subtle) bg-(--status-success-subtle) py-2.5">
      <AlertDescription
        style={{ color: "var(--status-success-text)" }}
        className="text-[13px] font-medium"
      >
        ✓ {count} gasto{plural ? "s" : ""} fijo{plural ? "s" : ""} generado
        {plural ? "s" : ""} para este mes
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 shrink-0"
        style={{ color: "var(--status-success-text)" }}
        onClick={onDismiss}
        aria-label="Cerrar"
      >
        <X className="size-4" />
      </Button>
    </Alert>
  );
}
