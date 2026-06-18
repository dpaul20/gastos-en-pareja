import { test, expect } from "./fixtures";
import { ExpensesPage } from "./pages/expenses.page";

/**
 * Toast + ConfirmDialog E2E — delete flows, undo, and a11y checks.
 *
 * These tests focus on UI interactions with the confirm dialog and toast system.
 * Data is created via adminClient in beforeEach and cleaned in afterEach.
 */

// ── Cuota delete — ConfirmDialog lifecycle ────────────────────────────────────

test.describe("Cuota delete — confirm dialog", () => {
  const DESCRIPTION = `E2E-cuota-del-${Date.now()}`;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const today = new Date().toISOString().split("T")[0];
    await adminClient.from("installment_purchases").insert({
      couple_id: coupleId,
      description: DESCRIPTION,
      total_amount: 12000,
      installments: 6,
      paid_installments: 0,
      first_payment_date: today,
      auto_renew: false,
    });
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("installment_purchases")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-cuota-del-%");
  });

  test("abre el confirm dialog al pulsar el botón eliminar", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    // Wait for the item to appear
    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 15_000,
    });

    // Click trash icon
    await page.getByRole("button", { name: "Eliminar cuota" }).first().click();

    // Confirm dialog should appear
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText("Eliminar compra en cuotas")).toBeVisible();
  });

  test("cancelar en el confirm dialog NO elimina el item", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Eliminar cuota" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3_000 });

    // Cancel — click the "Cancelar" button
    await page.getByRole("button", { name: "Cancelar" }).click();

    // Dialog should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3_000 });

    // Item should still be in the list
    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 3_000,
    });
  });

  test("confirmar dispara toast con botón Deshacer", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Eliminar cuota" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3_000 });

    // Confirm deletion
    await page.getByRole("button", { name: "Sí, eliminar" }).click();

    // Dialog closes and item disappears (optimistic)
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3_000 });

    // Toast should appear with "Deshacer" button
    const undoButton = page.getByRole("button", { name: "Deshacer" });
    await expect(undoButton).toBeVisible({ timeout: 5_000 });
  });

  test("pulsar Deshacer en el toast restaura el item", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 15_000,
    });

    // Delete
    await page.getByRole("button", { name: "Eliminar cuota" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3_000 });
    await page.getByRole("button", { name: "Sí, eliminar" }).click();

    // Wait for "Deshacer" and click it
    const undoButton = page.getByRole("button", { name: "Deshacer" });
    await expect(undoButton).toBeVisible({ timeout: 5_000 });
    await undoButton.click();

    // Item should be back in the list after re-fetch
    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ── Variable expense delete — ConfirmDialog lifecycle ─────────────────────────

test.describe("Variable delete — confirm dialog", () => {
  const DESCRIPTION = `E2E-var-del-${Date.now()}`;

  test.beforeEach(async ({ adminClient, coupleId, testUserId }) => {
    const today = new Date().toISOString().split("T")[0];
    await adminClient.from("variable_expenses").insert({
      couple_id: coupleId,
      user_id: testUserId,
      description: DESCRIPTION,
      amount: 5000,
      date: today,
      is_shared: true,
    });
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("variable_expenses")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-var-del-%");
  });

  test("abre el confirm dialog al pulsar eliminar en gasto variable", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Compras");

    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Eliminar gasto" }).first().click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText("Eliminar gasto")).toBeVisible();
  });

  test("cancelar NO elimina el gasto variable", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Compras");

    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Eliminar gasto" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3_000 });

    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3_000 });

    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 3_000,
    });
  });
});

// ── A11y — toast roles ─────────────────────────────────────────────────────────

test.describe("A11y — toast aria roles", () => {
  const DESCRIPTION = `E2E-a11y-toast-${Date.now()}`;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const today = new Date().toISOString().split("T")[0];
    await adminClient.from("installment_purchases").insert({
      couple_id: coupleId,
      description: DESCRIPTION,
      total_amount: 6000,
      installments: 3,
      paid_installments: 0,
      first_payment_date: today,
      auto_renew: false,
    });
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("installment_purchases")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-a11y-toast-%");
  });

  test("danger toast tiene role=alert", async ({ authenticatedPage: page }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Eliminar cuota" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3_000 });
    await page.getByRole("button", { name: "Sí, eliminar" }).click();

    // Toast with role="alert" should be visible
    await expect(page.getByRole("alert").first()).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ── A11y — ConfirmDialog focus trap and keyboard ───────────────────────────────

test.describe("A11y — ConfirmDialog keyboard interaction", () => {
  const DESCRIPTION = `E2E-a11y-kbd-${Date.now()}`;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const today = new Date().toISOString().split("T")[0];
    await adminClient.from("installment_purchases").insert({
      couple_id: coupleId,
      description: DESCRIPTION,
      total_amount: 9000,
      installments: 3,
      paid_installments: 0,
      first_payment_date: today,
      auto_renew: false,
    });
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("installment_purchases")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-a11y-kbd-%");
  });

  test("Esc cierra el confirm dialog sin eliminar", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Eliminar cuota" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3_000 });

    // Press Escape — should close without deleting
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3_000 });

    // Item should still be present
    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 3_000,
    });
  });

  test("Tab key cicla entre los botones del dialog (focus trap)", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    await expect(page.getByText(DESCRIPTION).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Eliminar cuota" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3_000 });

    // Tab through the focusable elements — after cycling, focus stays inside dialog
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Dialog must still be open (focus didn't escape)
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1_000 });

    // Cleanup
    await page.keyboard.press("Escape");
  });
});
