import { test, expect } from "./fixtures";

/**
 * "sin confirmar" removal E2E — PR4 (Phase 3).
 *
 * The entire `PENDING_CONFIRMATION` review UI (dashboard banner, amber
 * "Sin confirmar" pill, per-row "Confirmar" CTA, "Confirmar todos" bulk
 * action, and the "Pedirme confirmación cada mes" create-form toggle) is
 * deleted from the user-facing surface — decision 391/396, design D2/D5.
 *
 * This file used to cover SCEN-03 through SCEN-08 (the review flow itself).
 * Those scenarios no longer apply: the actions and UI they exercised
 * (`confirmFixedExpenseInstance`, `confirmAllFixedExpenseInstances`,
 * `PendingReviewBanner`, the amber pill, `toggle-requires-review`) were
 * deleted in this PR. Replaced with the spec's "fixed-review (REMOVED)"
 * domain requirement: no sin-confirmar surface remains anywhere, while a
 * legacy `PENDING_CONFIRMATION` row (the zombie-row guarantee, D2/RF-07)
 * keeps rendering normally and still counts at full weight — proven at the
 * pure-math layer by `balance.test.ts`, proven here at the UI layer.
 */

/** Returns current month as YYYY-MM-01 (matches getMonthDate() format) */
const currentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

/** A month safely before the current one, so isTemplateActiveInMonth passes. */
const templateCreatedAt = (): string => {
  const now = new Date();
  return new Date(now.getFullYear() - 1, 0, 1).toISOString();
};

test.describe("PR4: no sin-confirmar surface remains, legacy PENDING_CONFIRMATION row still renders", () => {
  const DESC = `E2E-legacy-pending-${Date.now()}`;
  let templateId: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    // Seed a template with the legacy, dead `requires_monthly_review` flag
    // still true (D6 — the column is NOT dropped, NOT migrated) and an
    // instance that is still `PENDING_CONFIRMATION` — the exact zombie row
    // production may already have live.
    const { data: template, error: tErr } = await adminClient
      .from("fixed_expense_templates")
      .insert({
        couple_id: coupleId,
        description: DESC,
        amount: 99_000,
        due_day: 15,
        requires_monthly_review: true,
        created_at: templateCreatedAt(),
      })
      .select("id")
      .single();
    if (tErr || !template)
      throw new Error(`Template seed failed: ${tErr?.message}`);
    templateId = template.id;

    const { error: iErr } = await adminClient
      .from("fixed_expense_instances")
      .insert({
        template_id: templateId,
        couple_id: coupleId,
        month: currentMonth(),
        paid: false,
        status: "PENDING_CONFIRMATION",
      });
    if (iErr) throw new Error(`Instance seed failed: ${iErr.message}`);
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

  test("la fila PENDING_CONFIRMATION se ve normal, con su monto, sin badge ni CTA de confirmación", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();
    await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });

    // Zombie row keeps its known amount, counted like any CONFIRMED row —
    // no "sin monto" placeholder, no exclusion.
    const row = page.locator("div").filter({ hasText: DESC }).first();
    await expect(
      row.getByRole("button", { name: "Editar monto" }),
    ).toContainText("$99.000");

    // No amber "Sin confirmar" pill anywhere on the page.
    await expect(page.getByText("Sin confirmar")).toHaveCount(0);
    // No per-row "Confirmar" CTA.
    await expect(
      page.getByRole("button", { name: "Confirmar", exact: true }),
    ).toHaveCount(0);
    // No bulk "Confirmar todos" action.
    await expect(page.getByTestId("confirm-all-fijos")).toHaveCount(0);
  });

  test("el dashboard no muestra banner de confirmación pendiente", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    await page.goto("/dashboard");
    // The seeded row already has its current-month instance, so
    // ensureFixedExpenseInstances has nothing new to create — wait for a
    // stable dashboard element instead of the "new instances" banner. The
    // "Balance {month}" heading always renders once data loads, regardless
    // of whether there is a debt to show this month.
    await expect(page.getByText(/^Balance /)).toBeVisible({
      timeout: 12_000,
    });
    await expect(page.getByTestId("pending-review-link")).toHaveCount(0);
    await expect(page.getByText(/necesita.*confirmaci[oó]n/i)).toHaveCount(0);
  });

  test("el formulario de nuevo servicio ya no tiene el toggle 'Pedirme confirmación cada mes'", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();
    await page.getByRole("button", { name: "Agregar gasto" }).click();
    await page.getByTestId("type-selector-sheet").waitFor({ state: "visible" });
    await page.getByTestId("type-option-servicio").click();
    await page.getByTestId("service-list-sheet").waitFor({ state: "visible" });
    await page.getByText("+ Nuevo servicio").click();
    await page.getByTestId("add-sheet-dialog").waitFor({ state: "visible" });

    await expect(page.getByTestId("toggle-requires-review")).toHaveCount(0);
    await expect(page.getByText("Pedirme confirmación cada mes")).toHaveCount(
      0,
    );
  });
});
