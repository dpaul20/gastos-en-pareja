import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PendingReviewBanner({ count }: { readonly count: number }) {
  if (count === 0) return null;
  const plural = count > 1;
  return (
    <Link href="/expenses" style={{ textDecoration: "none" }}>
      <Alert
        className="mb-3 flex items-center gap-2 border-(--color-coral) py-2.5"
        style={{
          background: "color-mix(in srgb, var(--color-coral) 10%, transparent)",
          cursor: "pointer",
        }}
      >
        <AlertDescription
          style={{ color: "var(--color-coral)" }}
          className="text-[13px] font-medium"
        >
          {count} servicio{plural ? "s" : ""} necesita{plural ? "n" : ""}{" "}
          confirmación — Revisar
        </AlertDescription>
      </Alert>
    </Link>
  );
}
