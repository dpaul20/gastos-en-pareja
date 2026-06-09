/**
 * Visual snapshot suite — catches layout regressions at mobile and desktop.
 *
 * Mobile:  393×851  (Pixel 5 — matches the chromium-mobile project default)
 * Desktop: 1366×768 (most common laptop resolution)
 *
 * First run: npm run test:visual:update  → generates baseline screenshots
 * Subsequent runs: npm run test:visual   → compares against baselines
 *
 * Snapshots are committed to the repo. Update them intentionally when the UI
 * changes: run test:visual:update, review the diffs, commit.
 */

import { test, expect } from "./fixtures";

const DESKTOP = { width: 1366, height: 768 };

const PAGES = [
  {
    name: "dashboard",
    path: "/dashboard",
    selector: '[data-testid="current-month"]',
  },
  { name: "expenses", path: "/expenses", selector: "h1" },
  { name: "history", path: "/history", selector: "h1" },
  { name: "settings", path: "/settings", selector: "h1" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function waitForPage(
  page: import("@playwright/test").Page,
  selector: string,
) {
  await page.waitForSelector(selector, { timeout: 12_000 });
  await page.waitForLoadState("networkidle", { timeout: 12_000 });
}

// ── Login (unauthenticated) ───────────────────────────────────────────────────

test.describe("Visual — login", () => {
  test("mobile", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("login-mobile.png");
  });

  test("desktop", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("login-desktop.png");
  });
});

// ── Authenticated pages — mobile ─────────────────────────────────────────────

test.describe("Visual — mobile (393px)", () => {
  for (const { name, path, selector } of PAGES) {
    test(name, async ({ authenticatedPage: page }) => {
      await page.goto(path);
      await waitForPage(page, selector);
      await expect(page).toHaveScreenshot(`${name}-mobile.png`);
    });
  }
});

// ── Authenticated pages — desktop ────────────────────────────────────────────

test.describe("Visual — desktop (1366px)", () => {
  for (const { name, path, selector } of PAGES) {
    test(name, async ({ authenticatedPage: page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(path);
      await waitForPage(page, selector);
      await expect(page).toHaveScreenshot(`${name}-desktop.png`);
    });
  }
});
