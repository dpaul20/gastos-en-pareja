export type ErrorKind =
  | "offline"
  | "session"
  | "validation"
  | "server"
  | "known";

export interface ErrorDescription {
  readonly kind: ErrorKind;
  readonly title: string;
  readonly message: string;
  /** Next.js digest — the id to look for in the Vercel runtime logs. */
  readonly code: string | null;
  readonly retryable: boolean;
}

/**
 * An error whose message is already written for the user and safe to show
 * verbatim (e.g. a client-side validation failure).
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

const NETWORK_RE =
  /failed to fetch|networkerror|network request failed|load failed|fetch failed|err_internet_disconnected/i;
const SESSION_RE = /no autenticado|unauthorized|jwt expired|not authenticated/i;
// Next.js replaces any error thrown by a Server Action with this generic text
// in production, so the specific "No se pudo guardar la compra" never arrives.
const MASKED_RE = /server components render|omitted in production builds/i;

const DEFAULT_TITLE = "No pudimos completar la acción";

function readDigest(err: unknown): string | null {
  if (typeof err === "object" && err !== null && "digest" in err) {
    const digest = (err as { digest?: unknown }).digest;
    if (typeof digest === "string" && digest.length > 0) return digest;
  }
  return null;
}

export function describeError(
  err: unknown,
  options: { online?: boolean; fallbackTitle?: string } = {},
): ErrorDescription {
  const { online = true, fallbackTitle } = options;
  const title = fallbackTitle ?? DEFAULT_TITLE;
  const raw = err instanceof Error ? err.message : "";
  const code = readDigest(err);

  if (err instanceof UserFacingError) {
    return {
      kind: "validation",
      title: raw,
      message: "",
      code: null,
      retryable: false,
    };
  }

  if (!online || NETWORK_RE.test(raw)) {
    return {
      kind: "offline",
      title: "Sin conexión",
      message: "Revisá tu internet. Tus datos no se perdieron.",
      code: null,
      retryable: true,
    };
  }

  if (SESSION_RE.test(raw)) {
    return {
      kind: "session",
      title: "Tu sesión venció",
      message: "Volvé a iniciar sesión para seguir.",
      code: null,
      retryable: false,
    };
  }

  if (MASKED_RE.test(raw) || raw === "") {
    return {
      kind: "server",
      title,
      message: "Fue un problema de nuestro lado. Probá de nuevo en un momento.",
      code,
      retryable: true,
    };
  }

  return {
    kind: "known",
    title: raw,
    message: "Probá de nuevo en un momento.",
    code,
    retryable: true,
  };
}

/** One-line text for inline (field-adjacent) error messages. */
export function inlineMessage(description: ErrorDescription): string {
  if (description.kind === "validation" || description.kind === "known") {
    return description.title;
  }
  return description.message
    ? `${description.title}. ${description.message}`
    : description.title;
}
