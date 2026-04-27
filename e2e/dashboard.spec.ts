import { test, expect } from "@playwright/test";

/**
 * Dashboard E2E tests.
 *
 * Pre-condition: dev server running + local Supabase up.
 * Auth: Google OAuth is skipped — user must be logged in manually or via saved storage state.
 * Run these tests after logging in once and saving auth state with:
 *   npx playwright codegen --save-storage=e2e/auth.json http://localhost:3000
 */

test.describe("Dashboard", () => {
  test("redirige a /login si no hay sesión", async ({ page }) => {
    // Fresh context — no cookies
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });

  test("página de login tiene el botón de Google", async ({ page }) => {
    await page.goto("/login");
    const btn = page.getByText("Continuar con Google");
    await expect(btn).toBeVisible();
  });

  test("login page muestra el nombre de la app", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Gastos en Pareja")).toBeVisible();
  });

  test("login page tiene las 3 feature pills", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByText("Distribución proporcional a ingresos"),
    ).toBeVisible();
    await expect(
      page.getByText("Control de cuotas y gastos fijos"),
    ).toBeVisible();
    await expect(page.getByText("Sincronizado entre los dos")).toBeVisible();
  });
});

test.describe("Navegación — sin sesión", () => {
  test("todas las rutas protegidas redirigen a /login", async ({ page }) => {
    for (const route of ["/dashboard", "/expenses", "/history", "/settings"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/login/, { timeout: 5_000 });
    }
  });

  test("/login no redirige (ruta pública)", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/login/);
    await expect(page).not.toHaveURL(/dashboard/);
  });
});
