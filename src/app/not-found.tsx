import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="app-ambient flex min-h-dvh items-center justify-center [background-color:var(--bg-base)] p-6">
      <div
        data-testid="not-found"
        className="rise-in glass relative w-full max-w-[420px] rounded-3xl p-8 text-center [font-family:var(--font-sans)]"
      >
        <div
          className="float-y mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl [background-color:var(--accent-subtle)] [color:var(--accent)]"
          aria-hidden="true"
        >
          <Compass size={30} />
        </div>
        <div
          aria-hidden="true"
          className="ds-amount mb-1 bg-gradient-to-r from-[var(--color-violet-500)] to-[var(--color-teal-400)] bg-clip-text text-[56px] leading-none font-bold text-transparent"
        >
          404
        </div>
        <h1 className="m-0 mb-2 text-lg font-semibold [color:var(--fg-1)]">
          No encontramos esta página
        </h1>
        <p className="m-0 mb-6 text-sm [color:var(--fg-2)]">
          Puede que el link esté vencido o que se haya movido.
        </p>
        <Link
          href="/dashboard"
          className="press inline-flex h-12 w-full items-center justify-center rounded-2xl [background-color:var(--accent)] px-4 font-semibold [color:var(--accent-foreground)] no-underline shadow-[var(--shadow-accent)]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
