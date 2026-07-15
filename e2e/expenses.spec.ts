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

// ── Tab descriptions ───────────────────────────────────────────────────────────

test.describe("Tab descriptions", () => {
  test("muestra la descripción correcta para cada tab", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    const descriptions: Record<string, string> = {
      Cuotas: "Compras en cuotas o planes de pago recurrentes",
      Servicios: "Agua, luz, expensas y servicios que se repiten cada mes",
      Compras: "Gastos puntuales del mes, compartidos o personales",
    };

    for (const [tabName, expectedText] of Object.entries(descriptions)) {
      await test.step(`tab ${tabName}`, async () => {
        await expenses.selectTab(tabName as "Cuotas" | "Servicios" | "Compras");
        await expect(page.getByTestId("tab-description")).toContainText(
          expectedText,
        );
      });
    }
  });
});

// ── Tab structure ──────────────────────────────────────────────────────────────

test.describe("Segmented control", () => {
  test("cada tab renderea los campos de formulario correctos", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    const tabFieldMap: Record<string, string[]> = {
      Compras: ["Descripción", "Monto", "Fecha (AAAA-MM-DD)"],
      Servicios: ["Descripción", "Monto", "Día de vencimiento (1-31)"],
      Cuotas: ["Descripción", "Monto total", "Cuotas", "Fecha del primer pago"],
    };

    for (const [tabName, expectedFields] of Object.entries(tabFieldMap)) {
      await test.step(`tab ${tabName}`, async () => {
        await expenses.selectTab(tabName as "Compras" | "Servicios" | "Cuotas");
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
    await expenses.selectTab("Compras");
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
    // El flujo completo (nav + form fill + server action + refetch) necesita más tiempo en CI
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Compras");
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
      timeout: 15_000,
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

  test("gasto fijo aparece en la lista de Servicios", async ({
    authenticatedPage: page,
  }) => {
    // El flujo completo (nav + form fill + server action + refetch) necesita más tiempo en CI
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Servicios");
    await expenses.openAddSheet();

    await expenses.dialogField("Descripción").fill(DESCRIPCION);
    await expenses.dialogField("Monto").fill("8000");
    await expenses.dialogField("Día de vencimiento (1-31)").fill("15");

    await expenses.saveButton().click();

    await expect(expenses.dialog()).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(DESCRIPCION).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

// ── Gasto Fijo — Edición de monto ────────────────────────────────────────────

test.describe("Gasto fijo — edición de monto inline", () => {
  const DESCRIPCION = `E2E-fijo-edit-${Date.now()}`;
  const MONTO_TEMPLATE = 8000;

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("fixed_expense_templates")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-fijo-edit-%");
  });

  test("editar el monto de un fijo persiste el override y actualiza el total", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Servicios");
    await expenses.openAddSheet();

    await expenses.dialogField("Descripción").fill(DESCRIPCION);
    await expenses.dialogField("Monto").fill(String(MONTO_TEMPLATE));
    await expenses.dialogField("Día de vencimiento (1-31)").fill("15");
    await expenses.saveButton().click();

    await expect(expenses.dialog()).not.toBeVisible({ timeout: 5_000 });
    // Wait for the item to appear in the list
    await expect(page.getByText(DESCRIPCION).first()).toBeVisible({
      timeout: 15_000,
    });

    // Tap the amount button to enter edit mode
    const amountButton = page.getByTitle("Editar monto").first();
    await amountButton.click();

    // Fill the override amount
    const input = page.locator('input[inputmode="decimal"]').first();
    await expect(input).toBeVisible({ timeout: 3_000 });
    await input.fill("12000");

    // Save with ✓ button
    await page.getByTitle("Guardar").first().click();

    // After save: override amount should be visible and "editado" pill should appear
    await expect(page.getByText("editado").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("$12.000").first()).toBeVisible({
      timeout: 5_000,
    });
  });
});

test.describe("Gasto fijo — restablecer monto al default", () => {
  const DESCRIPCION = `E2E-fijo-edit-reset-${Date.now()}`;
  const MONTO_TEMPLATE = 5000;

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("fixed_expense_templates")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-fijo-edit-reset-%");
  });

  test("restablecer override vuelve al monto del template y quita la pill", async ({
    adminClient,
    coupleId,
    authenticatedPage: page,
  }) => {
    test.slow();

    // Create template via UI first
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Servicios");
    await expenses.openAddSheet();

    await expenses.dialogField("Descripción").fill(DESCRIPCION);
    await expenses.dialogField("Monto").fill(String(MONTO_TEMPLATE));
    await expenses.dialogField("Día de vencimiento (1-31)").fill("20");
    await expenses.saveButton().click();

    await expect(expenses.dialog()).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(DESCRIPCION).first()).toBeVisible({
      timeout: 15_000,
    });

    // Set override via DB directly
    const { data: instance } = await adminClient
      .from("fixed_expense_instances")
      .select("id")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (instance) {
      await adminClient
        .from("fixed_expense_instances")
        .update({ amount_override: 9999 })
        .eq("id", instance.id);
    }

    // Reload to see the override state
    await page.reload();
    await expenses.selectTab("Servicios");

    // "editado" pill should be visible
    await expect(page.getByText("editado").first()).toBeVisible({
      timeout: 10_000,
    });

    // Click reset button (↻)
    await page
      .getByTitle(/Restablecer/)
      .first()
      .click();

    // After reset: "editado" pill should disappear
    await expect(page.getByText("editado")).not.toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("Gasto fijo — total del footer refleja overrides", () => {
  const DESC_A = `E2E-fijo-edit-footer-a-${Date.now()}`;
  const DESC_B = `E2E-fijo-edit-footer-b-${Date.now()}`;

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("fixed_expense_templates")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-fijo-edit-footer-%");
  });

  test("el total servicios refleja override en lugar del monto del template", async ({
    adminClient,
    coupleId,
    authenticatedPage: page,
  }) => {
    test.slow();

    const expenses = new ExpensesPage(page);

    // Create two fixed expense templates via UI
    for (const [desc, amount, due] of [
      [DESC_A, "10000", "5"],
      [DESC_B, "20000", "10"],
    ] as [string, string, string][]) {
      await expenses.goto();
      await expenses.selectTab("Servicios");
      await expenses.openAddSheet();
      await expenses.dialogField("Descripción").fill(desc);
      await expenses.dialogField("Monto").fill(amount);
      await expenses.dialogField("Día de vencimiento (1-31)").fill(due);
      await expenses.saveButton().click();
      await expect(expenses.dialog()).not.toBeVisible({ timeout: 5_000 });
    }

    // Override the first instance: change 10000 → 30000
    const { data: instances } = await adminClient
      .from("fixed_expense_instances")
      .select("id, fixed_expense_templates(description)")
      .eq("couple_id", coupleId);

    const instanceA = instances?.find(
      (i) =>
        (i.fixed_expense_templates as { description: string })?.description ===
        DESC_A,
    );

    expect(
      instanceA,
      "instance for DESC_A not found — join failed or template insert did not create instance",
    ).toBeDefined();

    // Record baseline total before override
    await expenses.goto();
    await expenses.selectTab("Servicios");
    await page.waitForLoadState("networkidle", { timeout: 10_000 });
    await expect(page.getByText("Total servicios")).toBeVisible({
      timeout: 10_000,
    });
    const baselineText = await page.getByTestId("fijos-total").innerText();
    const baseline = Number(baselineText.replace(/[^0-9]/g, ""));

    await adminClient
      .from("fixed_expense_instances")
      .update({ amount_override: 30000 })
      .eq("id", instanceA!.id);

    // Reload — footer should increase by +20000 (override 30000 replaces template 10000)
    await page.reload();
    await expenses.selectTab("Servicios");
    await page.waitForLoadState("networkidle", { timeout: 10_000 });
    await expect(page.getByText("Total servicios")).toBeVisible({
      timeout: 10_000,
    });
    const afterText = await page.getByTestId("fijos-total").innerText();
    const after = Number(afterText.replace(/[^0-9]/g, ""));
    expect(
      after,
      `footer debería haber aumentado en 20000 (baseline=${baseline})`,
    ).toBe(baseline + 20000);
  });
});

// ── Gasto cuota — CRUD ────────────────────────────────────────────────────────

test.describe("Gasto cuota — creación exitosa", () => {
  const DESCRIPCION = `E2E-cuota-${Date.now()}`;

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("installment_purchases")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-cuota-%");
  });

  test("cuota aparece en la lista después de ser creada", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Cuotas");
    await expenses.openAddSheet();

    await expenses.dialogField("Descripción").fill(DESCRIPCION);
    await expenses.dialogField("Monto total").fill("24000");
    await expenses.dialogField("Cuotas").fill("12");
    const today = new Date().toISOString().split("T")[0];
    await expenses.dialogField("Fecha del primer pago").fill(today);

    await expenses.saveButton().click();

    await expect(expenses.dialog()).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(DESCRIPCION).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

// ── Gasto variable — validación de formulario ─────────────────────────────────

test.describe("Gasto variable — validación de formulario", () => {
  test("TC-002: submit vacío muestra error y mantiene el dialog abierto", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Compras");
    await expenses.openAddSheet();

    await expenses.saveButton().click();

    // Dialog must stay open
    await expect(expenses.dialog()).toBeVisible({ timeout: 3_000 });
    // At least one validation error should be visible
    const errorMessages = expenses
      .dialog()
      .locator(
        "[aria-invalid='true'], [role='alert'], .text-destructive, p[class*='error'], span[class*='error']",
      );
    await expect(errorMessages.first()).toBeVisible({ timeout: 3_000 });
  });

  test("TC-003: monto negativo muestra error de validación", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Compras");
    await expenses.openAddSheet();

    await expenses.dialogField("Descripción").fill("Test descripción");
    await expenses.dialogField("Monto").fill("-100");

    await expenses.saveButton().click();

    // Dialog must stay open
    await expect(expenses.dialog()).toBeVisible({ timeout: 3_000 });
    // Error message for amount field
    const errorMessages = expenses
      .dialog()
      .locator(
        "[aria-invalid='true'], [role='alert'], .text-destructive, p[class*='error'], span[class*='error']",
      );
    await expect(errorMessages.first()).toBeVisible({ timeout: 3_000 });
  });
});

// ── Cuota auto_renew — permanece en lista ─────────────────────────────────────

test.describe("Cuota auto_renew — permanece en lista aunque esté pagada", () => {
  const DESCRIPCION = `E2E-auto-renew-${Date.now()}`;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const today = new Date().toISOString().split("T")[0];
    await adminClient.from("installment_purchases").insert({
      couple_id: coupleId,
      description: DESCRIPCION,
      total_amount: 9000,
      installments: 3,
      paid_installments: 3,
      auto_renew: true,
      first_payment_date: today,
    });
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("installment_purchases")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-auto-renew-%");
  });

  test("auto_renew item visible aunque paid_installments === installments", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    // Cuotas is the default tab
    await expect(page.getByText(DESCRIPCION).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

// ── Cuota terminada (Commit 6 / task 6.6) ─────────────────────────────────────
// A non-auto_renew cuota whose paid_installments reached installments stays
// visible + deletable but is no longer "Pagado" — it's "Terminada" (distinct
// badge; excluded from totals via isInstallmentActiveInMonth, already unit
// tested in installments.test.ts).

test.describe("Cuota terminada — visible, editable y eliminable, badge distinto", () => {
  const DESCRIPCION = `E2E-cuota-terminada-${Date.now()}`;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const today = new Date().toISOString().split("T")[0];
    await adminClient.from("installment_purchases").insert({
      couple_id: coupleId,
      description: DESCRIPCION,
      total_amount: 12000,
      installments: 3,
      paid_installments: 3,
      auto_renew: false,
      first_payment_date: today,
    });
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("installment_purchases")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-cuota-terminada-%");
  });

  test("muestra badge 'Terminada', permanece en la lista y se puede editar/eliminar", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    const item = page.locator("li", { hasText: DESCRIPCION }).first();
    await expect(item).toBeVisible({ timeout: 15_000 });

    // Distinct "Terminada" badge — not the generic "Pagado" of an
    // auto_renew cuota that just wrapped.
    await expect(item.getByTestId("cuota-status-badge")).toHaveText(
      "Terminada",
    );

    // Still editable: opens the AddSheet in edit mode, prefilled.
    await item.getByRole("button", { name: "Editar cuota" }).click();
    await expect(expenses.dialog()).toBeVisible({ timeout: 5_000 });
    await expect(expenses.dialogField("Descripción")).toHaveValue(DESCRIPCION);
    await page.keyboard.press("Escape");
    await expect(expenses.dialog()).not.toBeVisible({ timeout: 3_000 });

    // Still deletable via the existing confirm-dialog + undo pattern.
    await item.getByRole("button", { name: "¿Eliminar cuota?" }).click();
    await expect(page.getByText("Sí, eliminar")).toBeVisible({
      timeout: 3_000,
    });
    await page.getByText("Sí, eliminar").click();
    await expect(page.getByText("Cuota eliminada")).toBeVisible({
      timeout: 10_000,
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
    await expect(expenses.tabButton("Compras")).toBeVisible({
      timeout: 10_000,
    });
  });
});
