import { test, expect } from "./fixtures";

/**
 * Category navigation E2E (Commit 7 — clickable category breakdown).
 *
 * NOT executed this session (no dev server running) — deferred per the same
 * precedent as Commits 5/6's e2e additions. Written to strict-TDD spec
 * against the real DOM/DB, ready to run in CI or a future session with
 * `npm run test:e2e`.
 */

test.describe("Dashboard — categoría clickeable navega a /expenses filtrado", () => {
  const DESCRIPCION = `E2E-cat-nav-${Date.now()}`;
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

    const today = new Date().toISOString().split("T")[0];
    // Large unique amount so this row ranks within the dashboard's top-5
    // category breakdown regardless of other pre-existing seed data.
    await adminClient.from("variable_expenses").insert({
      couple_id: coupleId,
      user_id: (await adminClient.auth.admin.listUsers()).data.users[0].id,
      description: DESCRIPCION,
      amount: 999_000,
      date: today,
      is_shared: true,
      category_id: categoryId,
    });
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("variable_expenses")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-cat-nav-%");
  });

  test("click en una categoría real navega a /expenses?cat={id} y filtra la lista", async ({
    authenticatedPage: page,
  }) => {
    test.slow();

    await test.step("ir al dashboard y esperar el breakdown por categoría", async () => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle", { timeout: 12_000 });
      await expect(page.getByText("Por categoría")).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("clickear la categoría — navega con el query param correcto", async () => {
      const categoryRow = page
        .getByRole("button", { name: `Ver gastos de ${categoryName}` })
        .first();
      await expect(categoryRow).toBeVisible({ timeout: 10_000 });
      await categoryRow.click();
      await expect(page).toHaveURL(new RegExp(`/expenses\\?cat=${categoryId}`));
    });

    await test.step("la lista de /expenses muestra solo el gasto de esa categoría", async () => {
      await expect(page.getByText(DESCRIPCION)).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test("'Sin categoría' no es clickeable (no renderiza como botón)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });
    await expect(page.getByText("Por categoría")).toBeVisible({
      timeout: 10_000,
    });

    const sinCategoriaRow = page.getByRole("button", {
      name: "Ver gastos de Sin categoría",
    });
    await expect(sinCategoriaRow).toHaveCount(0);
  });
});
