import { test, expect } from "@playwright/test";

/**
 * Golden path E2E — usuario autenticado.
 * Requiere: npm run dev + supabase start
 * El global-setup crea el usuario de test y guarda auth.json
 */

test.use({ storageState: "e2e/auth.json" });

test.describe("Happy path — usuario autenticado", () => {
  test("redirige a /dashboard al estar autenticado", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("dashboard carga con el balance del mes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Balance/)).toBeVisible({ timeout: 10_000 });
  });

  test("bottom nav tiene los 4 tabs", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.locator("nav");
    await expect(nav.getByText("Inicio")).toBeVisible();
    await expect(nav.getByText("Gastos")).toBeVisible();
    await expect(nav.getByText("Historial")).toBeVisible();
    await expect(nav.getByText("Config")).toBeVisible();
  });

  test("navega a /expenses desde el bottom nav", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator("nav").getByText("Gastos").click();
    await expect(page).toHaveURL(/expenses/);
    // Verify the segmented control is visible (expenses-specific element)
    await expect(page.getByRole("button", { name: "Cuotas" })).toBeVisible();
  });

  test("/expenses muestra las 3 tabs de tipos de gasto", async ({ page }) => {
    await page.goto("/expenses");
    await expect(page.getByRole("button", { name: "Cuotas" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fijos" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Variables" })).toBeVisible();
  });

  test("agrega un gasto variable y aparece en la lista", async ({ page }) => {
    await page.goto("/expenses");
    await page.getByRole("button", { name: "Variables" }).click();

    // Abrir FAB
    await page.getByLabel("Agregar gasto").click();
    await expect(page.getByText("Nuevo gasto — variables")).toBeVisible();

    // Completar form
    const inputs = page.locator("input");
    await inputs.nth(0).fill("Test supermercado");
    await inputs.nth(1).fill("5000");

    await page.getByRole("button", { name: "Guardar" }).click();

    // Verificar que aparece en la lista
    await expect(page.getByText("Test supermercado")).toBeVisible({
      timeout: 8_000,
    });
  });

  test("cerrar sesión redirige a /login", async ({ page }) => {
    await page.goto("/settings");
    await page.getByText("Cerrar sesión").click();
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });
});
