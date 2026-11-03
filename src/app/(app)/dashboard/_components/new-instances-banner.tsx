import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";

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
    <Alert className="rise-in mb-3 flex items-center justify-between gap-2 rounded-2xl border-(--status-success-subtle) bg-(--status-success-subtle) py-2.5">
      <CheckCircle2
        aria-hidden
        className="pop-in size-4 shrink-0 [color:var(--status-success-text)]"
      />
      <AlertDescription className="flex-1 text-[13px] font-medium [color:var(--status-success-text)]">
        {count} gasto{plural ? "s" : ""} fijo{plural ? "s" : ""} generado
        {plural ? "s" : ""} para este mes
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="press size-9 shrink-0 rounded-full [color:var(--status-success-text)]"
        onClick={onDismiss}
        aria-label="Cerrar"
      >
        <X className="size-4" />
      </Button>
    </Alert>
  );
}
