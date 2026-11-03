"use client";

import { ErrorPanel } from "@/components/shared/error-panel";
import "./globals.css";

type GlobalErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-dvh items-center justify-center [background-color:var(--bg-base)] p-6">
          <ErrorPanel digest={error.digest} onRetry={reset} />
        </div>
      </body>
    </html>
  );
}
