import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center [background-color:var(--bg-base)] p-6">
      <div
        data-testid="not-found"
        className="fx-rise w-full max-w-[420px] rounded-[var(--radius-lg)] border [border-color:var(--border-subtle)] [background-color:var(--bg-elevated)] p-6 text-center [font-family:var(--font-sans)] shadow-[var(--shadow-sm)]"
      >
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full [background-color:var(--bg-sunken)] [color:var(--fg-2)]"
          aria-hidden="true"
        >
          <Compass size={26} />
        </div>
        <h1 className="m-0 mb-2 text-lg font-semibold [color:var(--fg-1)]">
          No encontramos esta página
        </h1>
        <p className="m-0 mb-5 text-sm [color:var(--fg-2)]">
          Puede que el link esté vencido o que se haya movido.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] [background-color:var(--accent)] px-4 font-semibold text-white no-underline"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
