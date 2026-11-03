"use client";

import { useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { notify } from "@/lib/feedback/notify";
import { describeError } from "@/lib/utils/describe-error";

interface SuccessNotice {
  readonly title: string;
  readonly description?: string;
  readonly action?: {
    readonly label: string;
    readonly onClick: () => void | Promise<void>;
  };
}

interface UseActionOptions<R> {
  /** Title shown when the action fails and the server gave no safe message. */
  readonly errorTitle: string;
  /** Query keys to invalidate after a successful run. */
  readonly invalidate?: readonly QueryKey[];
  readonly success?: string | ((result: R) => SuccessNotice | string | null);
  readonly onSuccess?: (result: R) => void | Promise<void>;
  readonly onError?: (error: unknown) => void;
}

/**
 * Runs a Server Action with the app-wide feedback contract: a pending flag,
 * query invalidation, a success notice, and — on failure — a classified error
 * notice whose "Reintentar" repeats the exact same call. Never throws.
 */
export function useAction<A extends unknown[], R>(
  action: (...args: A) => Promise<R>,
  options: UseActionOptions<R>,
) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function run(...args: A): Promise<R | undefined> {
    setPending(true);
    try {
      const result = await action(...args);
      await Promise.all(
        (options.invalidate ?? []).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
      await options.onSuccess?.(result);
      announce(result);
      return result;
    } catch (err) {
      const description = describeError(err, {
        online: typeof navigator === "undefined" ? true : navigator.onLine,
        fallbackTitle: options.errorTitle,
      });
      notify.error(description, { onRetry: () => void run(...args) });
      options.onError?.(err);
      return undefined;
    } finally {
      setPending(false);
    }
  }

  function announce(result: R) {
    const { success } = options;
    if (!success) return;
    const notice = typeof success === "function" ? success(result) : success;
    if (!notice) return;
    if (typeof notice === "string") notify.success(notice);
    else
      notify.success(notice.title, {
        description: notice.description,
        action: notice.action,
      });
  }

  return { run, pending };
}
