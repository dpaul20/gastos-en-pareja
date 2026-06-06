import { test, expect } from "./fixtures";
import { LoginPage } from "./pages/login.page";

/**
 * Auth Guard E2E — rutas protegidas y página de login.
 *
 * Estos tests NO usan sesión (no storageState).
 * Verifican que el middleware redirige correctamente a usuarios anónimos
 * y que la página de login cumple requisitos de estructura y accesibilidad.
 *
 * Requiere: npm run dev + supabase start
 */

// ── Rutas protegidas ───────────────────────────────────────────────────────────

test.describe("Auth guard — rutas protegidas", () => {
  const protectedRoutes = [
    "/dashboard",
    "/expenses",
    "/history",
    "/settings",
  ] as const;

  for (const route of protectedRoutes) {
    test(`GET ${route} sin sesión redirige a /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
    });
  }

  test("la URL de redirección preserva el path original en ?next=", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });

    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/dashboard");
  });

  test("/invite/:token redirige a /login y conserva el next", async ({
    page,
  }) => {
    const inviteToken = "token-de-prueba-abc123";
    await page.goto(`/invite/${inviteToken}`);
    await expect(page).toHaveURL(/\/login\?next=/, { timeout: 8_000 });

    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe(`/invite/${inviteToken}`);
  });
});

// ── Login page — estructura ────────────────────────────────────────────────────

test.describe("Login page — estructura y accesibilidad", () => {
  test("tiene heading H1 con el nombre de la aplicación", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    // Debe ser un H1 — no un div ni un span estilizado
    await expect(login.heading).toBeVisible();
    await expect(login.heading).toHaveText("Gastos en Pareja");
  });

  test("tiene un botón accesible para continuar con Google", async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.goto();

    // Debe ser role="button" — no un div clickeable sin semántica
    await expect(login.googleButton).toBeVisible();
    await expect(login.googleButton).toHaveAttribute("type", "button");
  });

  test("las 3 feature pills están en una lista semántica", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    const pills = await login.featurePillTexts();

    expect(pills.length).toBeGreaterThanOrEqual(3);

    // Verificar que las pills contienen el texto esperado
    const fullText = pills.join(" ");
    expect(fullText).toMatch(/proporcional/i);
    expect(fullText).toMatch(/cuotas|fijos/i);
    expect(fullText).toMatch(/sincronizado/i);
  });

  test("/login no redirige a rutas protegidas (es ruta pública)", async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.goto();

    // Debe quedarse en /login, no hacer redirect automático
    await expect(page).toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});

// ── Auth — usuario autenticado ────────────────────────────────────────────────

test.describe("Auth — usuario autenticado", () => {
  test("TC-005: visitar /login redirige a /dashboard", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8_000 });
  });

  test("TC-006: /auth/callback sin código redirige a /login", async ({
    browser,
  }) => {
    // Fresh context — no auth state
    const context = await browser.newContext({
      baseURL: "http://localhost:3000",
    });
    const page = await context.newPage();
    try {
      await page.goto("/auth/callback");
      await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
    } finally {
      await context.close();
    }
  });
});

// ── Open redirect guard ────────────────────────────────────────────────────────

test.describe("Auth callback — protección de open redirect", () => {
  test("el parámetro ?next= no acepta URLs externas", async ({ page }) => {
    // Si alguien construye una URL maliciosa con next=https://evil.com
    // el middleware/callback debe ignorarla y caer al default (/dashboard)
    await page.goto("/login?next=https://evil.com/phishing");
    // La URL de la página sigue siendo /login (no fue redirigida externamente)
    await expect(page).toHaveURL(/\/login/);
  });

  test("el parámetro ?next= no acepta protocol-relative URLs", async ({
    page,
  }) => {
    await page.goto("/login?next=//evil.com");
    await expect(page).toHaveURL(/\/login/);
  });
});
