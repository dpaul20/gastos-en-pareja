const INVITE_TOKEN = /^\/invite\/[^/]+/;

/**
 * Strips data that must not leave the app from a page URL before it is sent
 * to a third party (e.g. Vercel Speed Insights): the invitation token in
 * `/invite/<token>` and any query string or hash.
 */
export function redactUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const pathname = parsed.pathname.replace(INVITE_TOKEN, "/invite/[token]");
  return `${parsed.origin}${pathname}`;
}
