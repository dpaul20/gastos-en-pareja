import { test, expect } from "./fixtures";

/**
 * Editing a servicio's category.
 *
 * `updateFixedExpenseTemplate` accepted `category_id` from the start, and the
 * create form has always had a picker — but the edit sheet never rendered one,
 * so a servicio could be categorised once and never again. That dead-ended the
 * whole point of making "Sin categoría" navigable: you could finally FIND the
 * uncategorised services and still not fix them.
 *
 * Category is template-level, so it saves on pick rather than riding the
 * amount/due-day submit — which an AWAITING_BILL instance never reaches, and
 * those are exactly the ones most likely to be missing a category.
 */

const currentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

const templateCreatedAt = (): string => {
  const now = new Date();
  return new Date(now.getFullYear() - 1, 0, 1).toISOString();
};

test.describe("Servicio — editar categoría desde el sheet", () => {
  const DESC = `E2E-svc-cat-${Date.now()}`;
  let templateId: string;
  let categoryId: string;
  let categoryName: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const { data: category } = await adminClient
      .from("expense_categories")
      .select("id, name")
      .order("sort_order")
      .limit(1)
      .single();
    if (!category) throw new Error("No expense_categories seeded");
    categoryId = category.id;
    categoryName = category.name;

    // Seeded WITHOUT a category — the state the user is trying to fix.
    const { data: template, error } = await adminClient
      .from("fixed_expense_templates")
      .insert({
        couple_id: coupleId,
        description: DESC,
        amount: 72_375,
        due_day: 25,
        awaits_bill: false,
        category_id: null,
        created_at: templateCreatedAt(),
      })
      .select("id")
      .single();
    if (error || !template)
      throw new Error(`Template seed failed: ${error?.message}`);
    templateId = template.id;

    await adminClient.from("fixed_expense_instances").insert({
      template_id: templateId,
      couple_id: coupleId,
      month: currentMonth(),
      paid: false,
      status: "CONFIRMED",
    });
  });

  test.afterEach(async ({ adminClient }) => {
    if (templateId) {
      await adminClient
        .from("fixed_expense_instances")
        .delete()
        .eq("template_id", templateId);
      await adminClient
        .from("fixed_expense_templates")
        .delete()
        .eq("id", templateId);
    }
  });

  test("asignar una categoría a un servicio la persiste en el template", async ({
    authenticatedPage: page,
    adminClient,
  }) => {
    test.slow();
    await page.goto("/expenses");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });
    await page.getByTestId("tab-servicios").click();
    await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });

    // The sheet opens from the "Vence día" line, not from "Editar monto" —
    // that one swaps the amount for an inline editor and never opens a modal.
    const row = page.locator("div").filter({ hasText: DESC }).first();
    await row
      .getByRole("button", { name: "Editar día de vencimiento" })
      .click();
    await expect(page.getByTestId("edit-service-sheet")).toBeVisible();

    // The picker exists at all — this is what was missing.
    const picker = page.getByTestId("edit-service-category");
    await expect(picker).toBeVisible();

    await picker.getByRole("radio", { name: categoryName }).click();

    // Saves on pick: no "Guardar" involved, the template already has it.
    await expect
      .poll(
        async () => {
          const { data } = await adminClient
            .from("fixed_expense_templates")
            .select("category_id")
            .eq("id", templateId)
            .maybeSingle();
          return data?.category_id ?? null;
        },
        { timeout: 8_000 },
      )
      .toBe(categoryId);
  });

  test("un servicio sin factura también puede categorizarse", async ({
    authenticatedPage: page,
    adminClient,
  }) => {
    test.slow();
    // AWAITING_BILL skips the amount branch of the submit entirely, so a
    // category batched into that submit would never save for these rows.
    await adminClient
      .from("fixed_expense_instances")
      .update({ status: "AWAITING_BILL" })
      .eq("template_id", templateId);

    await page.goto("/expenses");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });
    await page.getByTestId("tab-servicios").click();
    await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });

    // The sheet opens from the "Vence día" line, not from "Editar monto" —
    // that one swaps the amount for an inline editor and never opens a modal.
    const row = page.locator("div").filter({ hasText: DESC }).first();
    await row
      .getByRole("button", { name: "Editar día de vencimiento" })
      .click();
    await expect(page.getByTestId("edit-service-sheet")).toBeVisible();

    await page
      .getByTestId("edit-service-category")
      .getByRole("radio", { name: categoryName })
      .click();

    await expect
      .poll(
        async () => {
          const { data } = await adminClient
            .from("fixed_expense_templates")
            .select("category_id")
            .eq("id", templateId)
            .maybeSingle();
          return data?.category_id ?? null;
        },
        { timeout: 8_000 },
      )
      .toBe(categoryId);
  });
});
