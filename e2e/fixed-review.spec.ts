import { test, expect } from "./fixtures";

/**
 * Fixed Expense Monthly Review E2E — covers SCEN-03 through SCEN-08.
 *
 * Approach: use adminClient for seed data instead of UI where possible,
 * to keep test surface lean and minimize flakiness.
 *
 * Each test cleans up after itself via afterEach deleting by a unique description.
 */

/** Returns current month as YYYY-MM-01 (matches getMonthDate() format) */
const currentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Seeds a fixed expense template + instance directly in DB.
 * Returns { templateId, instanceId }.
 */
async function seedFixedTemplate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any,
  coupleId: string,
  description: string,
  requiresMonthlyReview: boolean,
) {
  const { data: template, error: tErr } = await adminClient
    .from("fixed_expense_templates")
    .insert({
      couple_id: coupleId,
      description,
      amount: 99_000,
      due_day: 15,
      requires_monthly_review: requiresMonthlyReview,
    })
    .select("id")
    .single();
  if (tErr || !template) throw new Error(`Template seed failed: ${tErr?.message}`);

  const { data: instance, error: iErr } = await adminClient
    .from("fixed_expense_instances")
    .insert({
      template_id: template.id,
      couple_id: coupleId,
      month: currentMonth(),
      paid: false,
      status: requiresMonthlyReview ? "PENDING_CONFIRMATION" : "CONFIRMED",
    })
    .select("id")
    .single();
  if (iErr || !instance) throw new Error(`Instance seed failed: ${iErr?.message}`);

  return { templateId: template.id, instanceId: instance.id };
}

// ── SCEN-03: Template requires_monthly_review=true → instance shows "Sin confirmar" badge ──

test.describe("SCEN-03: Template con review → instancia muestra badge", () => {
  const DESC = `E2E-review-pending-${Date.now()}`;
  let templateId: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const result = await seedFixedTemplate(
      adminClient,
      coupleId,
      DESC,
      true, // requires_monthly_review = true
    );
    templateId = result.templateId;
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

  test("instancia PENDING muestra badge 'Sin confirmar'", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();
    // Wait for the list to populate
    await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText("Sin confirmar").first(),
    ).toBeVisible();
  });
});

// ── SCEN-04: Confirmar instancia individual → badge desaparece ────────────────

test.describe("SCEN-04: Confirmar instancia individual", () => {
  const DESC = `E2E-review-confirm-${Date.now()}`;
  let templateId: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const result = await seedFixedTemplate(adminClient, coupleId, DESC, true);
    templateId = result.templateId;
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

  test("click Confirmar elimina el badge 'Sin confirmar'", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();
    await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });

    // Find the Confirmar button for this item
    const confirmBtn = page.getByRole("button", { name: "Confirmar" }).first();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Badge should disappear after mutation + query invalidation
    await expect(page.getByText("Sin confirmar")).not.toBeVisible({
      timeout: 8_000,
    });
    // The item should still be present (just confirmed)
    await expect(page.getByText(DESC)).toBeVisible();
  });
});

// ── SCEN-05: "Confirmar todos" → todos los badges desaparecen ─────────────────

test.describe("SCEN-05: Confirmar todos", () => {
  const DESC1 = `E2E-review-all-1-${Date.now()}`;
  const DESC2 = `E2E-review-all-2-${Date.now()}`;
  const templateIds: string[] = [];

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const r1 = await seedFixedTemplate(adminClient, coupleId, DESC1, true);
    const r2 = await seedFixedTemplate(adminClient, coupleId, DESC2, true);
    templateIds.push(r1.templateId, r2.templateId);
  });

  test.afterEach(async ({ adminClient }) => {
    for (const id of templateIds) {
      await adminClient
        .from("fixed_expense_instances")
        .delete()
        .eq("template_id", id);
      await adminClient
        .from("fixed_expense_templates")
        .delete()
        .eq("id", id);
    }
    templateIds.length = 0;
  });

  test("'Confirmar todos' elimina todos los badges", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();
    await expect(page.getByText(DESC1)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(DESC2)).toBeVisible({ timeout: 5_000 });

    // Button is visible because pendingFijosCount > 0
    const confirmAllBtn = page.getByTestId("confirm-all-fijos");
    await expect(confirmAllBtn).toBeVisible();
    await confirmAllBtn.click();

    // All "Sin confirmar" badges should disappear
    await expect(page.getByText("Sin confirmar")).toHaveCount(0, {
      timeout: 8_000,
    });
    // Both items still present
    await expect(page.getByText(DESC1)).toBeVisible();
    await expect(page.getByText(DESC2)).toBeVisible();
  });
});

// ── SCEN-06: Template requires_monthly_review=false → no badge ───────────────

test.describe("SCEN-06: Template sin review → sin badge", () => {
  const DESC = `E2E-review-none-${Date.now()}`;
  let templateId: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const result = await seedFixedTemplate(
      adminClient,
      coupleId,
      DESC,
      false, // requires_monthly_review = false
    );
    templateId = result.templateId;
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

  test("instancia CONFIRMED no muestra badge 'Sin confirmar'", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();
    await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });
    // There should be no "Sin confirmar" badge in the vicinity of this item
    const item = page.getByText(DESC);
    await expect(item).toBeVisible();
    // The badge text should not be visible for a CONFIRMED item
    // (There may be other PENDING items in the test account, so check locally)
    const row = page.locator("div").filter({ hasText: DESC }).first();
    await expect(row.getByText("Sin confirmar")).not.toBeVisible();
  });
});

// ── SCEN-07: Dashboard muestra banner con count PENDING ───────────────────────

test.describe("SCEN-07: Dashboard banner con instancias PENDING", () => {
  const DESC = `E2E-review-banner-${Date.now()}`;
  let templateId: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const result = await seedFixedTemplate(adminClient, coupleId, DESC, true);
    templateId = result.templateId;
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

  test("dashboard muestra banner de confirmación pendiente", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    await page.goto("/dashboard");
    // Banner should be visible (count >= 1 PENDING instance)
    await expect(
      page.getByText(/necesita(n)? confirmación/i),
    ).toBeVisible({ timeout: 12_000 });
    // Banner links to /expenses
    const bannerLink = page.getByTestId("pending-review-link");
    await expect(bannerLink).toHaveAttribute("href", "/expenses");
  });
});

// ── SCEN-08: Toggle en create-form persiste requires_monthly_review ───────────

test.describe("SCEN-08: Toggle en create-form persiste el flag", () => {
  const DESC = `E2E-review-toggle-${Date.now()}`;

  test.afterEach(async ({ adminClient, coupleId }) => {
    // Clean up any template created by this test
    const { data: templates } = await adminClient
      .from("fixed_expense_templates")
      .select("id")
      .eq("couple_id", coupleId)
      .like("description", "E2E-review-toggle-%");
    if (templates?.length) {
      for (const t of templates) {
        await adminClient
          .from("fixed_expense_instances")
          .delete()
          .eq("template_id", t.id);
      }
      await adminClient
        .from("fixed_expense_templates")
        .delete()
        .in(
          "id",
          templates.map((t) => t.id),
        );
    }
  });

  test("crear servicio con toggle ON → instancia nace con badge 'Sin confirmar'", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();

    // Open the add sheet via FAB → TypeSelector → Servicio → ServiceList → Nuevo servicio
    await page.getByRole("button", { name: "Agregar gasto" }).click();
    await page.getByTestId("type-selector-sheet").waitFor({ state: "visible" });
    await page.getByTestId("type-option-servicio").click();
    await page.getByTestId("service-list-sheet").waitFor({ state: "visible" });
    await page.getByText("+ Nuevo servicio").click();
    await page.getByTestId("add-sheet-dialog").waitFor({ state: "visible" });

    // Fill the form
    await page.getByLabel("Descripción").fill(DESC);
    await page.getByLabel("Monto").fill("45000");
    await page.getByLabel("Día de vencimiento (1-31)").fill("10");

    // Enable the "Pedirme confirmación cada mes" toggle
    const toggle = page.getByTestId("toggle-requires-review");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    // Save
    await page.getByRole("button", { name: "Guardar" }).click();
    await page.getByTestId("add-sheet-dialog").waitFor({ state: "hidden" });

    // The new item should show the "Sin confirmar" badge
    await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Sin confirmar").first()).toBeVisible();
  });
});
