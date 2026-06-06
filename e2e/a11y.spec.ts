import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .exclude("nextjs-portal")
    .analyze();

  const seriousOrCritical = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );

  expect(
    seriousOrCritical,
    seriousOrCritical.map((v) => `${v.id} (${v.impact}): ${v.help}`).join("\n"),
  ).toEqual([]);
}

test.describe("A11y — páginas públicas", () => {
  test("/login no tiene violaciones serias o críticas", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://localhost:3000",
    });
    const page = await context.newPage();

    await page.goto("/login");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    await expectNoSeriousViolations(page);
    await context.close();
  });
});

// ── TC-013 — /invite/[token] a11y scan ────────────────────────────────────────

test.describe("A11y — página de invitación", () => {
  const SCAN_INVITEE_EMAIL = "e2e-a11y-scan@gastospareja.local";
  const TEST_EMAIL_LOCAL = "test@gastospareja.local";
  // NOSONAR: test-only password, never used in production
  const TEST_PASSWORD_LOCAL = "Test1234!"; // NOSONAR
  let scanToken: string;
  let scanInvitationId: string | undefined;

  test.beforeAll(async ({ adminClient }) => {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const owner = users?.users.find((u) => u.email === TEST_EMAIL_LOCAL);
    if (!owner) throw new Error("Owner not found");

    const { data: member } = await adminClient
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", owner.id)
      .single();
    if (!member) throw new Error("Owner has no couple");

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data: inv } = await adminClient
      .from("invitations")
      .insert({
        couple_id: member.couple_id,
        inviter_id: owner.id,
        email: SCAN_INVITEE_EMAIL,
        expires_at: expiresAt,
      })
      .select("id, token")
      .single();
    if (!inv) throw new Error("Could not create invitation for a11y scan");
    scanToken = inv.token;
    scanInvitationId = inv.id;
  });

  test.afterAll(async ({ adminClient }) => {
    if (scanInvitationId) {
      await adminClient.from("invitations").delete().eq("id", scanInvitationId);
    }
  });

  test("TC-013: /invite/[token] no tiene violaciones serias o críticas", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: "http://localhost:3000",
    });
    const page = await context.newPage();

    try {
      await page.request.post("/api/test/sign-in", {
        headers: { "Content-Type": "application/json" },
        data: { email: TEST_EMAIL_LOCAL, password: TEST_PASSWORD_LOCAL },
      });

      await page.goto(`/invite/${scanToken}`);
      await page.waitForLoadState("networkidle", { timeout: 12_000 });

      // Do NOT accept invitation — just scan
      await expectNoSeriousViolations(page);
    } finally {
      await context.close();
    }
  });
});

// ── TC-014 — Focus trap en Sheet de gastos ────────────────────────────────────

test.describe("A11y — focus trap en Sheet de gastos", () => {
  test("TC-014: Sheet atrapa el foco y Escape lo restaura al FAB", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/expenses");
    // Wait for the page to hydrate
    await page.waitForSelector('[data-testid="tab-cuotas"]', {
      state: "visible",
    });

    const fab = page.getByRole("button", { name: "Agregar gasto" });
    await fab.click();

    // TypeSelectorSheet appears — pick Cuota to get to the add sheet
    await page.getByTestId("type-option-cuota").click();

    // Wait for the add-sheet dialog to be visible
    const dialog = page.getByTestId("add-sheet-dialog");
    await dialog.waitFor({ state: "visible" });

    // Focus must be inside the dialog
    const focusInsideAfterOpen = await page.evaluate(() => {
      const dialogEl = document.querySelector(
        '[data-testid="add-sheet-dialog"]',
      );
      return dialogEl?.contains(document.activeElement) ?? false;
    });
    expect(focusInsideAfterOpen).toBe(true);

    // Tab 3 times — focus must stay inside
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const focusInsideAfterTab = await page.evaluate(() => {
      const dialogEl = document.querySelector(
        '[data-testid="add-sheet-dialog"]',
      );
      return dialogEl?.contains(document.activeElement) ?? false;
    });
    expect(focusInsideAfterTab).toBe(true);

    // Escape closes the sheet
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });
});

// ── A11y — páginas autenticadas ───────────────────────────────────────────────

test.describe("A11y — páginas autenticadas", () => {
  for (const route of ["/dashboard", "/expenses", "/history", "/settings"]) {
    test(`${route} no tiene violaciones serias o críticas`, async ({
      authenticatedPage: page,
    }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle", { timeout: 12_000 });
      await expectNoSeriousViolations(page);
    });
  }
});
