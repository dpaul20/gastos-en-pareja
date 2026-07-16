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

/**
 * Scoped variant — checks ONLY the given selector's subtree. Used for the
 * PR3 "sin factura" surfaces so a genuinely pre-existing, app-wide finding
 * (the bottom nav's `--fg-3`-on-dark-`--bg-elevated` contrast, present
 * before this PR and unrelated to it — see PR3 apply-progress) does not
 * mask or get conflated with the correctness of the NEW code this PR adds.
 */
async function expectNoSeriousViolationsIn(page: Page, selector: string) {
  const results = await new AxeBuilder({ page })
    .exclude("nextjs-portal")
    .include(selector)
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

// ── A11y — landmark structure ─────────────────────────────────────────────────

test.describe("A11y — landmark structure", () => {
  for (const route of ["/dashboard", "/expenses", "/history", "/settings"]) {
    test(`${route} tiene exactamente 1 <main>, al menos 1 <nav>, y al menos 1 <h1>`, async ({
      authenticatedPage: page,
    }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle", { timeout: 12_000 });
      await expect(page.locator("main")).toHaveCount(1);

      // On mobile (Pixel 5), the sidebar <nav> lives inside a Radix Sheet that
      // does not pre-render its children until the sheet is opened.
      const trigger = page.locator('[data-sidebar="trigger"]');
      if (await trigger.isVisible()) await trigger.click();

      await expect(page.locator("nav")).not.toHaveCount(0);
      await expect(page.locator("h1")).not.toHaveCount(0);
    });
  }
});

// ── A11y — "sin factura" row, pill, sheet (PR3, D4 tokens) ────────────────────
// `ThemeProvider` is `attribute="class"` + `defaultTheme="system"` (providers.tsx)
// — `page.emulateMedia({ colorScheme })` before navigation drives which theme
// actually renders, exactly like a real OS-level dark mode preference.

test.describe("A11y — sin factura (fila, pill, sheet) en ambos temas", () => {
  const DESC = `E2E-a11y-sin-factura-${Date.now()}`;
  let templateId: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const { data: template, error } = await adminClient
      .from("fixed_expense_templates")
      .insert({
        couple_id: coupleId,
        description: DESC,
        amount: 72_375,
        due_day: 10,
        awaits_bill: true,
      })
      .select("id")
      .single();
    if (error || !template)
      throw new Error(`Template seed failed: ${error?.message}`);
    templateId = template.id;

    const { error: iErr } = await adminClient
      .from("fixed_expense_instances")
      .insert({
        template_id: templateId,
        couple_id: coupleId,
        month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
        paid: false,
        status: "AWAITING_BILL",
      });
    if (iErr) throw new Error(`Instance seed failed: ${iErr.message}`);
  });

  test.afterEach(async ({ adminClient }) => {
    await adminClient
      .from("fixed_expense_instances")
      .delete()
      .eq("template_id", templateId);
    await adminClient
      .from("fixed_expense_templates")
      .delete()
      .eq("id", templateId);
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`/expenses con fila 'sin factura' — ${colorScheme}`, async ({
      authenticatedPage: page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/expenses");
      await page.getByTestId("tab-servicios").click();
      await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId("fijo-item-awaiting")).toBeVisible();
      await expectNoSeriousViolationsIn(
        page,
        '[data-testid="fijo-item-awaiting"]',
      );
    });

    test(`sheet 'Cargar factura' — ${colorScheme}`, async ({
      authenticatedPage: page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/expenses");
      await page.getByTestId("tab-servicios").click();
      await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });
      await page.getByTestId("open-load-bill").click();
      await page.getByTestId("load-bill-sheet").waitFor({ state: "visible" });
      await expectNoSeriousViolationsIn(
        page,
        '[data-testid="load-bill-sheet"]',
      );
    });

    test(`sheet 'Editar servicio' — bloques nuevos (CTA sin factura + checkbox) — ${colorScheme}`, async ({
      authenticatedPage: page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/expenses");
      await page.getByTestId("tab-servicios").click();
      await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });
      await page
        .getByRole("button", { name: "Editar día de vencimiento" })
        .first()
        .click();
      await page
        .getByTestId("edit-service-sheet")
        .waitFor({ state: "visible" });
      // Scoped to the PR3 blocks only — `edit-service-sheet` as a whole also
      // renders pre-existing, unrelated components (e.g. `DueDayPicker`)
      // that carry their own separate, pre-existing dark-mode contrast gap
      // (see PR3 apply-progress); scanning the full sheet here would
      // conflate that unrelated debt with this PR's own correctness.
      await expectNoSeriousViolationsIn(
        page,
        '[data-testid="awaiting-bill-cta"]',
      );
      await expectNoSeriousViolationsIn(
        page,
        '[data-testid="awaits-bill-section"]',
      );
    });
  }
});
