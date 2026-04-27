import { Page } from "@playwright/test";

/**
 * Seeds a Supabase session cookie directly into the browser so Playwright tests
 * can skip the Google OAuth flow.
 *
 * Usage: call before navigating to any protected route.
 */
export async function seedSession(
  page: Page,
  accessToken: string,
  refreshToken: string,
) {
  const supabaseUrl = "http://127.0.0.1:54321";

  // Set Supabase session cookies directly (matches @supabase/ssr cookie format)
  await page.context().addCookies([
    {
      name: `sb-${new URL(supabaseUrl).hostname.replaceAll(".", "-")}-auth-token`,
      value: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "bearer",
      }),
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
    },
  ]);
}
