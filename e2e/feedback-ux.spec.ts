/**
 * Feedback UX — offline pill, save failure recovery, first-error focus,
 * error pages. Runs across several phone viewports and both color schemes.
 */
import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "iPhone SE", w: 375, h: 667 },
  { name: "iPhone 14", w: 390, h: 844 },
  { name: "Pro Max", w: 430, h: 932 },
] as const;

async function openCompraForm(page: Page) {
  await page.goto("/expenses");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Agregar gasto" }).click();
  await page.getByTestId("type-option-compra").click();
  await page.waitForSelector('[role="dialog"] form');
}

for (const vp of VIEWPORTS) {
  for (const scheme of ["light", "dark"] as const) {
    test.describe(`feedback UX — ${vp.name} ${scheme}`, () => {
      test.use({ colorScheme: scheme });

      test("offline pill appears, then confirms the reconnection", async ({
        authenticatedPage: page,
      }) => {
        const context = page.context();
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await page.goto("/dashboard");
        await page.waitForLoadState("networkidle");

        await context.setOffline(true);
        const pill = page.getByTestId("connection-status");
        await expect(pill).toBeVisible();
        await expect(pill).toContainText(/sin conexión/i);

        // The pill must sit inside the viewport, clear of the top edge.
        const box = await pill.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(vp.w);

        await context.setOffline(false);
        await expect(pill).toContainText(/volviste/i);
        await page.screenshot({
          path: `test-results/feedback-offline-${vp.w}-${scheme}.png`,
        });
      });

      test("failed save keeps the sheet open with the typed data and recovers on retry", async ({
        authenticatedPage: page,
      }) => {
        test.setTimeout(60_000);
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await openCompraForm(page);

        await page.locator("#field-description").fill("Prueba feedback");
        await page.locator("#field-amount").fill("1234");

        // Server Actions are POSTs carrying a `next-action` header.
        let failing = true;
        await page.route("**/expenses", async (route) => {
          const isAction =
            route.request().method() === "POST" &&
            route.request().headers()["next-action"] !== undefined;
          if (isAction && failing) {
            await route.fulfill({ status: 500, body: "boom" });
          } else {
            await route.continue();
          }
        });

        await page.getByRole("button", { name: /Guardar/ }).click();

        const banner = page.getByTestId("save-error");
        await expect(banner).toBeVisible();
        await expect(banner).toBeInViewport();
        await expect(page.locator("#field-description")).toHaveValue(
          "Prueba feedback",
        );
        await page.screenshot({
          path: `test-results/feedback-save-error-${vp.w}-${scheme}.png`,
        });

        failing = false;
        await banner.getByRole("button", { name: "Reintentar" }).click();
        await expect(page.locator('[role="dialog"] form')).toBeHidden({
          timeout: 25_000,
        });
        await expect(page.getByText("Prueba feedback").first()).toBeVisible();
      });

      test("invalid submit moves focus to the first broken field", async ({
        authenticatedPage: page,
      }) => {
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await openCompraForm(page);

        await page.getByRole("button", { name: /Guardar/ }).click();
        await expect(page.locator("#field-description")).toBeFocused();
      });
    });
  }
}

test.describe("feedback UX — error pages", () => {
  test("unknown route renders the friendly not-found with a way home", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/esto-no-existe");
    await expect(page.getByTestId("not-found")).toBeVisible();
    await page.getByRole("link", { name: "Volver al inicio" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
