import { test, expect } from "./fixtures";
import { BottomNav } from "./pages/nav.page";
import { ExpensesPage } from "./pages/expenses.page";

/**
 * Golden path E2E — usuario autenticado.
 *
 * Cada test:
 * - Usa el fixture `authenticatedPage` (contexto aislado con auth.json)
 * - Limpia sus propios datos via adminClient en afterEach
 * - Verifica estado real, no sólo visibilidad
 *
 * Requiere: npm run dev + supabase start
 */

// ── Entry point ────────────────────────────────────────────────────────────────

test.describe("Raíz — usuario autenticado", () => {
  test("GET / redirige a /dashboard", async ({ authenticatedPage: page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  });
});

// ── Dashboard ──────────────────────────────────────────────────────────────────

test.describe("Dashboard", () => {
  test("muestra el encabezado de balance del mes", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard");
    // Esperar a que TanStack Query termine de cargar los datos del servidor
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    // El heading "Balance" debe existir y ser de nivel heading semánticamente
    const balanceHeading = page.getByRole("heading", { name: /balance/i });
    await expect(balanceHeading).toBeVisible({ timeout: 10_000 });
  });

  test("navegar al mes anterior cambia la URL o el estado", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard");
    // Esperar a que TanStack Query termine de cargar los datos del servidor
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    // El MonthHeader muestra el mes actual en un span con data-testid
    const monthLabel = page.getByTestId("current-month");
    await monthLabel.waitFor({ state: "visible", timeout: 10_000 });

    const initialMonth = await monthLabel.textContent();

    // Clickear "Mes anterior" — cambia state inmediatamente (sin esperar datos)
    await page.getByRole("button", { name: "Mes anterior" }).click();

    // El span debe mostrar un mes distinto
    await expect(monthLabel).not.toHaveText(initialMonth ?? "", {
      timeout: 3_000,
    });
  });
});

// ── Bottom Navigation ──────────────────────────────────────────────────────────

test.describe("Bottom Nav", () => {
  test("contiene los 4 destinos requeridos", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard");
    const nav = new BottomNav(page);

    // Los links deben existir y ser accesibles por role
    await expect(nav.link("Inicio")).toBeVisible();
    await expect(nav.link("Gastos")).toBeVisible();
    await expect(nav.link("Historial")).toBeVisible();
    await expect(nav.link("Config")).toBeVisible();
  });

  test("el link activo tiene aria-current='page'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard");
    const nav = new BottomNav(page);

    const active = await nav.activePage();
    expect(active).toBe("Inicio");
  });

  test.describe("navegación", () => {
    for (const [label, expectedPath] of [
      ["Gastos", "/expenses"],
      ["Historial", "/history"],
      ["Config", "/settings"],
      ["Inicio", "/dashboard"],
    ] as const) {
      test(`click en "${label}" navega a ${expectedPath}`, async ({
        authenticatedPage: page,
      }) => {
        await page.goto("/dashboard");
        const nav = new BottomNav(page);
        await nav.navigateTo(label);
        await expect(page).toHaveURL(new RegExp(expectedPath));
      });
    }
  });
});

// ── Expenses — estructura de UI ────────────────────────────────────────────────

test.describe("Expenses — tabs del segmented control", () => {
  test("las 3 tabs se renderizan como botones accesibles", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    await expect(expenses.tabButton("Cuotas")).toBeVisible();
    await expect(expenses.tabButton("Fijos")).toBeVisible();
    await expect(expenses.tabButton("Variables")).toBeVisible();
  });

  test("el dialog de Variables tiene los campos correctos", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Variables");
    await expenses.openAddSheet();

    // Verificar que los campos esperados existen con sus labels accesibles
    await expect(expenses.dialogField("Descripción")).toBeVisible();
    await expect(expenses.dialogField("Monto")).toBeVisible();
    await expect(expenses.dialogField("Fecha (AAAA-MM-DD)")).toBeVisible();

    // El dialog title anuncia el tipo de gasto
    await expect(
      expenses.dialog().getByText("Nuevo gasto — variables"),
    ).toBeVisible();
  });

  test("el dialog de Cuotas tiene los campos específicos de cuotas", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    // Cuotas es el tab inicial
    await expenses.openAddSheet();

    await expect(expenses.dialogField("Monto total")).toBeVisible();
    await expect(expenses.dialogField("Cuotas")).toBeVisible();
    await expect(
      expenses.dialogField("Primer pago (AAAA-MM-DD)"),
    ).toBeVisible();
  });

  test("el dialog de Fijos tiene el campo de vencimiento", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Fijos");
    await expenses.openAddSheet();

    await expect(
      expenses.dialogField("Día de vencimiento (1-31)"),
    ).toBeVisible();
  });
});

// ── Expenses — CRUD ────────────────────────────────────────────────────────────

test.describe("Expenses — creación de gasto variable", () => {
  // Limpieza de datos creados durante el test
  const DESCRIPCION_TEST = `E2E-variable-${Date.now()}`;

  test.afterEach(async ({ adminClient, coupleId }) => {
    // Eliminar el gasto de prueba para no contaminar runs posteriores
    await adminClient
      .from("variable_expenses")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-variable-%");
  });

  test("agrega un gasto variable y aparece en la lista", async ({
    authenticatedPage: page,
  }) => {
    // El flujo completo (nav + form fill + server action + refetch) necesita más tiempo en CI
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Variables");

    await test.step("abrir el formulario", async () => {
      await expenses.openAddSheet();
      await expect(
        expenses.dialog().getByText("Nuevo gasto — variables"),
      ).toBeVisible();
    });

    await test.step("completar campos con datos válidos", async () => {
      await expenses.dialogField("Descripción").fill(DESCRIPCION_TEST);
      // Verificar que el valor fue cargado correctamente
      await expect(expenses.dialogField("Descripción")).toHaveValue(
        DESCRIPCION_TEST,
      );

      await expenses.dialogField("Monto").fill("1500");
      await expect(expenses.dialogField("Monto")).toHaveValue("1500");
    });

    await test.step("guardar y verificar que aparece en la lista", async () => {
      await expenses.saveButton().click();
      // El dialog debe cerrarse tras guardar exitosamente
      await expect(expenses.dialog()).not.toBeVisible({ timeout: 5_000 });
      // El item debe aparecer en la lista
      await expect(expenses.itemByDescription(DESCRIPCION_TEST)).toBeVisible({
        timeout: 15_000,
      });
    });
  });
});

// ── Sign out ───────────────────────────────────────────────────────────────────

test.describe("Cerrar sesión", () => {
  test("redirige a /login y ya no se puede acceder a rutas protegidas", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/settings");
    // El botón "Cerrar sesión" debe existir como botón accesible
    const logoutBtn = page.getByRole("button", { name: /cerrar sesión/i });
    await expect(logoutBtn).toBeVisible();

    await logoutBtn.click();

    // Post-logout: la URL debe ser /login
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });

    // Una ruta protegida ya no es accesible con esta sesión
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
