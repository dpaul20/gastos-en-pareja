"use client";

import { ErrorPanel } from "@/components/shared/error-panel";

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center [background-color:var(--bg-base)] p-6">
      <ErrorPanel digest={error.digest} onRetry={reset} />
    </div>
  );
}
