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

  test("el sheet de filtros ofrece 'Sin categoría' como opción", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/expenses");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });
    await page.getByTestId("expenses-filters-button").click();
    await expect(page.getByTestId("category-filter-sheet")).toBeVisible();
    await page.getByTestId("filter-uncategorized").click();
    await expect(page).toHaveURL(/cat=sin-categoria/);
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

  // Used to assert the OPPOSITE — that "Sin categoría" rendered as inert
  // text. It is usually the biggest bar, and being unable to open it meant
  // being unable to reach those expenses to categorise them at all. The whole
  // point of the row is to be the way in, so the trip is asserted end to end:
  // bar → filtered list → the uncategorised expense actually on screen.
  test("'Sin categoría' abre la lista filtrada de gastos sin categoría", async ({
    authenticatedPage: page,
    adminClient,
    coupleId,
  }) => {
    test.slow();
    const uncategorised = `E2E-cat-nav-sin-cat-${Date.now()}`;
    await adminClient.from("variable_expenses").insert({
      couple_id: coupleId,
      user_id: (await adminClient.auth.admin.listUsers()).data.users[0].id,
      description: uncategorised,
      amount: 998_000,
      date: new Date().toISOString().split("T")[0],
      is_shared: true,
      category_id: null,
    });

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });
    await expect(page.getByText("Por categoría")).toBeVisible({
      timeout: 10_000,
    });

    const sinCategoriaRow = page
      .getByRole("button", { name: "Ver gastos de Sin categoría" })
      .first();
    await expect(sinCategoriaRow).toBeVisible({ timeout: 10_000 });
    await sinCategoriaRow.click();

    await expect(page).toHaveURL(/\/expenses\?cat=sin-categoria/);
    await expect(page.getByText(uncategorised)).toBeVisible({
      timeout: 10_000,
    });
    // The filter is real, not just a URL: the categorised expense seeded in
    // beforeEach must be filtered OUT.
    await expect(page.getByText(DESCRIPCION)).toHaveCount(0);
  });
});
