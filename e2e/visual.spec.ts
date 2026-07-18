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

// ── Expenses — Compras tab (variable-item row) ───────────────────────────────
// Dedicated pixel-identity oracle for the DS refactor: covers the amount +
// edit-button + Personal-badge row rendered by variable-item.tsx.
//
// NOTE (discovered during Slice 1a/1b apply): the shared test couple's
// financial data is wiped by the `cleanSlate` auto-fixture before every
// test, and this test seeds none of its own — so this snapshot is actually
// the tab's EMPTY state ("Sin gastos variables"), not a rendered
// variable-item row. It still guards the empty-state chrome but does NOT
// prove pixel-identity for the amount/badge/edit-button markup the Slice 0
// apply-progress claimed it covered. Left as-is (out of this slice's
// scope) — flagged as a follow-up: seed a row here the same way the new
// "(populated)" Cuotas/Servicios tests below do.

test.describe("Visual — expenses Compras tab", () => {
  test("mobile", async ({ authenticatedPage: page }) => {
    await page.goto("/expenses");
    await waitForPage(page, "h1");
    await page.getByTestId("tab-compras").click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("expenses-compras-mobile.png");
  });
});

// ── Expenses — Cuotas tab, populated (cuota-item row) ────────────────────────
// Dedicated pixel-identity oracle for Slice 1a: seeds real rows so the
// screenshot actually exercises cuota-item.tsx's Progress/Badge/.ds-amount
// markup (the generic "expenses-mobile" snapshot above renders the tab's
// empty state, since `cleanSlate` wipes the shared couple before every
// test and that test seeds nothing).

test.describe("Visual — expenses Cuotas tab (populated)", () => {
  const DESC_PENDING = "Visual-cuota-pending";
  const DESC_DONE = "Visual-cuota-terminada";

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const today = new Date().toISOString().split("T")[0];
    await adminClient.from("installment_purchases").insert([
      {
        couple_id: coupleId,
        description: DESC_PENDING,
        total_amount: 40000,
        installments: 4,
        paid_installments: 1,
        auto_renew: false,
        first_payment_date: today,
      },
      {
        couple_id: coupleId,
        description: DESC_DONE,
        total_amount: 12000,
        installments: 3,
        paid_installments: 3,
        auto_renew: false,
        first_payment_date: today,
      },
    ]);
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("installment_purchases")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "Visual-cuota-%");
  });

  test("mobile", async ({ authenticatedPage: page }) => {
    await page.goto("/expenses");
    await waitForPage(page, "h1");
    await page.getByTestId("tab-cuotas").click();
    await expect(page.getByText(DESC_DONE)).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("expenses-cuotas-populated-mobile.png");
  });
});

// ── Expenses — Servicios tab, populated (fijo-item row) ──────────────────────
// Dedicated pixel-identity oracle for Slice 1b: seeds a normal row (with
// "editado" + "Personal" + "nuevo" pills) and an AWAITING_BILL ("sin
// factura") row, so the screenshot exercises fijo-item.tsx's two structural
// branches, the Badge sin-factura/personal/editado variants, and the
// .ds-amount spans.

test.describe("Visual — expenses Servicios tab (populated)", () => {
  const DESC_NORMAL = "Visual-fijo-normal";
  const DESC_AWAITING = "Visual-fijo-sin-factura";
  let normalTemplateId: string;
  let awaitingTemplateId: string;

  test.beforeEach(async ({ adminClient, coupleId, testUserId }) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const { data: normalTemplate, error: normalErr } = await adminClient
      .from("fixed_expense_templates")
      .insert({
        couple_id: coupleId,
        description: DESC_NORMAL,
        amount: 15000,
        due_day: 12,
        is_shared: false,
        owner_user_id: testUserId,
      })
      .select("id")
      .single();
    if (normalErr || !normalTemplate)
      throw new Error(`Normal template seed failed: ${normalErr?.message}`);
    normalTemplateId = normalTemplate.id;

    await adminClient.from("fixed_expense_instances").insert({
      template_id: normalTemplateId,
      couple_id: coupleId,
      month,
      paid: false,
      status: "CONFIRMED",
      amount_override: 18000,
      billed_at: now.toISOString(),
    });

    const { data: awaitingTemplate, error: awaitingErr } = await adminClient
      .from("fixed_expense_templates")
      .insert({
        couple_id: coupleId,
        description: DESC_AWAITING,
        amount: 5000,
        due_day: 20,
        awaits_bill: true,
      })
      .select("id")
      .single();
    if (awaitingErr || !awaitingTemplate)
      throw new Error(
        `Awaiting-bill template seed failed: ${awaitingErr?.message}`,
      );
    awaitingTemplateId = awaitingTemplate.id;

    await adminClient.from("fixed_expense_instances").insert({
      template_id: awaitingTemplateId,
      couple_id: coupleId,
      month,
      paid: false,
      status: "AWAITING_BILL",
    });
  });

  test.afterEach(async ({ adminClient }) => {
    for (const templateId of [normalTemplateId, awaitingTemplateId]) {
      await adminClient
        .from("fixed_expense_instances")
        .delete()
        .eq("template_id", templateId);
      await adminClient
        .from("fixed_expense_templates")
        .delete()
        .eq("id", templateId);
    }
  });

  test("mobile", async ({ authenticatedPage: page }) => {
    await page.goto("/expenses");
    await waitForPage(page, "h1");
    await page.getByTestId("tab-servicios").click();
    await expect(page.getByText(DESC_AWAITING)).toBeVisible({
      timeout: 10_000,
    });
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot(
      "expenses-servicios-populated-mobile.png",
    );
  });
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
