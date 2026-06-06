import { test, expect } from "./fixtures";
import { BottomNav } from "./pages/nav.page";
import { TEST_EMAIL } from "./config";

function getPreviousMonthDate() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * History screen E2E — pantalla de historial.
 *
 * Requiere: npm run dev + supabase start + auth.json generado.
 */

// ── Estructura básica ──────────────────────────────────────────────────────────

test.describe("Historial — estructura de página", () => {
  test("muestra el heading Historial", async ({ authenticatedPage: page }) => {
    await page.goto("/history");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });
    await expect(page.getByRole("heading", { name: /historial/i })).toBeVisible(
      { timeout: 10_000 },
    );
  });

  test("el link de Historial en nav tiene aria-current='page'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/history");
    const nav = new BottomNav(page);
    await nav.openIfMobile();
    const active = await nav.activePage();
    expect(active).toBe("Historial");
  });
});

// ── Cards de meses ─────────────────────────────────────────────────────────────

test.describe("Historial — cards de meses", () => {
  let testUserId: string;
  const previousMonth = getPreviousMonthDate();
  // Mid-month date so it falls inside the previous month's range
  const previousMonthMid = previousMonth.replace(/-01$/, "-15");

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
    if (!testUser) throw new Error("Test user not found");
    testUserId = testUser.id;

    await adminClient.from("incomes").upsert(
      {
        couple_id: coupleId,
        user_id: testUserId,
        amount: 999_001,
        month: previousMonth,
      },
      { onConflict: "couple_id,user_id,month" },
    );

    // Seed a variable expense so totalExpenses > 0 and MonthCard renders as <button>
    await adminClient.from("variable_expenses").insert({
      couple_id: coupleId,
      user_id: testUserId,
      description: "E2E-history-cards-expense",
      amount: 5_000,
      date: previousMonthMid,
      is_shared: true,
    });
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("incomes")
      .delete()
      .eq("couple_id", coupleId)
      .eq("user_id", testUserId)
      .eq("month", previousMonth);
    await adminClient
      .from("variable_expenses")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-history-cards-expense");
  });

  test("muestra al menos una card de mes cuando hay datos", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/history");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    // Hay al menos un botón de mes (month card es un <button>)
    const cards = page.getByTestId("month-card");
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Detalle de mes ────────────────────────────────────────────────────────────

test.describe("Historial — detalle de mes", () => {
  let testUserId: string;
  const previousMonth = getPreviousMonthDate();
  const previousMonthMid = previousMonth.replace(/-01$/, "-15");

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
    if (!testUser) throw new Error("Test user not found");
    testUserId = testUser.id;

    await adminClient.from("incomes").upsert(
      {
        couple_id: coupleId,
        user_id: testUserId,
        amount: 888_002,
        month: previousMonth,
      },
      { onConflict: "couple_id,user_id,month" },
    );

    // Seed a variable expense so totalExpenses > 0 and MonthCard renders as <button>
    await adminClient.from("variable_expenses").insert({
      couple_id: coupleId,
      user_id: testUserId,
      description: "E2E-history-detail-expense",
      amount: 5_000,
      date: previousMonthMid,
      is_shared: true,
    });
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("incomes")
      .delete()
      .eq("couple_id", coupleId)
      .eq("user_id", testUserId)
      .eq("month", previousMonth);
    await adminClient
      .from("variable_expenses")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-history-detail-expense");
  });

  test("click en card abre el detalle con badge Solo lectura", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/history");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    const firstCard = page.getByTestId("month-card").first();
    await firstCard.waitFor({ state: "visible", timeout: 10_000 });
    await firstCard.click();

    await expect(page.getByText("Solo lectura")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("botón volver desde el detalle regresa a la lista", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/history");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    const firstCard = page.getByTestId("month-card").first();
    await firstCard.waitFor({ state: "visible", timeout: 10_000 });
    await firstCard.click();

    await expect(page.getByText("Solo lectura")).toBeVisible({
      timeout: 5_000,
    });

    await page.getByRole("button", { name: "Volver" }).click();

    await expect(page.getByRole("heading", { name: /historial/i })).toBeVisible(
      { timeout: 5_000 },
    );
  });
});
