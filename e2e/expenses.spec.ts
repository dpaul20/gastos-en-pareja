import { test, expect } from "./fixtures";
import { ExpensesPage } from "./pages/expenses.page";

/**
 * Expenses E2E — cobertura de casos de negocio y edge cases.
 *
 * Cada test:
 * - Trabaja con su propio conjunto de datos (descripción única con timestamp)
 * - Limpia via adminClient en afterEach para no contaminar otros runs
 * - Verifica estado real (valores de campos, texto en lista) no sólo visibilidad
 */

// ── Tab structure ──────────────────────────────────────────────────────────────

test.describe("Segmented control", () => {
  test("cada tab renderea los campos de formulario correctos", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    const tabFieldMap: Record<string, string[]> = {
      Variables: ["Descripción", "Monto", "Fecha (AAAA-MM-DD)"],
      Fijos: ["Descripción", "Monto", "Día de vencimiento (1-31)"],
      Cuotas: [
        "Descripción",
        "Monto total",
        "Cuotas",
        "Primer pago (AAAA-MM-DD)",
      ],
    };

    for (const [tabName, expectedFields] of Object.entries(tabFieldMap)) {
      await test.step(`tab ${tabName}`, async () => {
        await expenses.selectTab(tabName as "Variables" | "Fijos" | "Cuotas");
        await expenses.openAddSheet();

        for (const fieldLabel of expectedFields) {
          await expect(
            expenses.dialogField(fieldLabel),
            `campo "${fieldLabel}" debe existir en tab ${tabName}`,
          ).toBeVisible();
        }

        // Cerrar sin guardar para el siguiente test.step
        await page.keyboard.press("Escape");
        await expect(expenses.dialog()).not.toBeVisible({ timeout: 3_000 });
      });
    }
  });
});

// ── Dialog lifecycle ───────────────────────────────────────────────────────────

test.describe("Dialog — ciclo de vida", () => {
  test("el dialog se abre con el FAB y se cierra con Escape", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    // Pre-condición: dialog no visible
    await expect(expenses.dialog()).not.toBeVisible();

    await expenses.openAddSheet();
    await expect(expenses.dialog()).toBeVisible();

    // Cerrar con teclado
    await page.keyboard.press("Escape");
    await expect(expenses.dialog()).not.toBeVisible({ timeout: 3_000 });
  });

  test("los campos del dialog empiezan vacíos", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Variables");
    await expenses.openAddSheet();

    await expect(expenses.dialogField("Descripción")).toHaveValue("");
    await expect(expenses.dialogField("Monto")).toHaveValue("");
  });
});

// ── Gasto Variable — CRUD ──────────────────────────────────────────────────────

test.describe("Gasto variable — creación exitosa", () => {
  // Descripción única por run para evitar colisiones entre tests
  const DESCRIPCION = `E2E-var-${Date.now()}`;

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("variable_expenses")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-var-%");
  });

  test("gasto variable aparece en la lista con la descripción correcta", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Variables");
    await expenses.openAddSheet();

    await expenses.dialogField("Descripción").fill(DESCRIPCION);
    await expenses.dialogField("Monto").fill("2500");

    // La fecha tiene formato AAAA-MM-DD — usamos la fecha de hoy
    const today = new Date().toISOString().split("T")[0];
    await expenses.dialogField("Fecha (AAAA-MM-DD)").fill(today);

    await expenses.saveButton().click();

    // El dialog debe cerrarse — señal de éxito
    await expect(expenses.dialog()).not.toBeVisible({ timeout: 5_000 });

    // El item con la descripción exacta debe aparecer en la lista
    await expect(page.getByText(DESCRIPCION).first()).toBeVisible({
      timeout: 8_000,
    });
  });
});

// ── Gasto Fijo — CRUD ─────────────────────────────────────────────────────────

test.describe("Gasto fijo — creación exitosa", () => {
  const DESCRIPCION = `E2E-fijo-${Date.now()}`;

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("fixed_expense_templates")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-fijo-%");
  });

  test("gasto fijo aparece en la lista de Fijos", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Fijos");
    await expenses.openAddSheet();

    await expenses.dialogField("Descripción").fill(DESCRIPCION);
    await expenses.dialogField("Monto").fill("8000");
    await expenses.dialogField("Día de vencimiento (1-31)").fill("15");

    await expenses.saveButton().click();

    await expect(expenses.dialog()).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(DESCRIPCION).first()).toBeVisible({
      timeout: 8_000,
    });
  });
});

// ── Network failure ────────────────────────────────────────────────────────────

test.describe("Manejo de errores de red", () => {
  test("la página de expenses sigue respondiendo aunque la API falle", async ({
    authenticatedPage: page,
  }) => {
    // Simular un 500 evita resetear el socket del dev server y mantiene
    // el objetivo del test: la UI debe sobrevivir a un fallo parcial.
    await page.route("**/rest/v1/variable_expenses*", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "simulated e2e failure" }),
      });
    });

    const expenses = new ExpensesPage(page);
    // La página debe cargar aunque falle una query específica —
    // no debe mostrar una pantalla de error total
    await page.goto("/expenses");
    await expect(expenses.tabButton("Variables")).toBeVisible({
      timeout: 10_000,
    });
  });
});
