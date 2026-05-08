import { test, expect } from "./fixtures";
import { TEST_EMAIL } from "./config";

function getMonthDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function getPreviousMonthDate() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-01`;
}

// ── Income carry-over ─────────────────────────────────────────────────────────

test.describe("Income carry-over — sugerencia del mes anterior", () => {
  let testUserId: string;
  const currentMonth = getMonthDate();
  const previousMonth = getPreviousMonthDate();
  const previousAmount = 150_000;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    // Resolve the test user id
    const { data: users } = await adminClient.auth.admin.listUsers();
    const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
    if (!testUser) throw new Error("Test user not found");
    testUserId = testUser.id;

    // Ensure no income for the current month
    await adminClient
      .from("incomes")
      .delete()
      .eq("couple_id", coupleId)
      .eq("user_id", testUserId)
      .eq("month", currentMonth);

    // Insert income for the previous month
    await adminClient.from("incomes").upsert(
      {
        couple_id: coupleId,
        user_id: testUserId,
        amount: previousAmount,
        month: previousMonth,
      },
      { onConflict: "couple_id,user_id,month" },
    );
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    await adminClient
      .from("incomes")
      .delete()
      .eq("couple_id", coupleId)
      .eq("user_id", testUserId)
      .in("month", [currentMonth, previousMonth]);
  });

  test("muestra el banner cuando hay ingreso anterior pero no del mes actual", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    await expect(page.getByText(/Igual al mes pasado/i)).toBeVisible({
      timeout: 8_000,
    });
  });

  test("el banner rellena el input al hacer click", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    // Click the carry-over suggestion button
    await page.getByText(/Igual al mes pasado/i).click();

    // The income input should now contain the previous month's amount
    const incomeInput = page.getByPlaceholder("0");
    await expect(incomeInput).toHaveValue(String(previousAmount));
  });

  test("el banner desaparece tras guardar el ingreso", async ({
    authenticatedPage: page,
    adminClient,
    coupleId,
  }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    // Accept the suggestion
    await page.getByText(/Igual al mes pasado/i).click();

    // Save the income
    await page.getByRole("button", { name: "Guardar ingreso" }).click();

    // Wait for the Server Action to complete — button returns to non-loading state
    await expect(
      page.getByRole("button", { name: "Guardar ingreso" }),
    ).toBeEnabled({ timeout: 8_000 });

    // Banner should disappear now that current month has income
    await expect(page.getByText(/Igual al mes pasado/i)).not.toBeVisible({
      timeout: 8_000,
    });

    // Verify the record was created in the database
    const { data } = await adminClient
      .from("incomes")
      .select("amount")
      .eq("couple_id", coupleId)
      .eq("user_id", testUserId)
      .eq("month", currentMonth)
      .single();

    expect(data?.amount).toBe(previousAmount);
  });

  test("no muestra el banner cuando ya existe ingreso del mes actual", async ({
    authenticatedPage: page,
    adminClient,
    coupleId,
  }) => {
    // Insert current month income before loading the page
    await adminClient.from("incomes").upsert(
      {
        couple_id: coupleId,
        user_id: testUserId,
        amount: 200_000,
        month: currentMonth,
      },
      { onConflict: "couple_id,user_id,month" },
    );

    await page.goto("/settings");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    await expect(page.getByText(/Igual al mes pasado/i)).not.toBeVisible({
      timeout: 5_000,
    });
  });
});

// ── Sin ingreso previo ────────────────────────────────────────────────────────

test.describe("Income — sin ingreso previo", () => {
  test("no muestra el banner cuando no hay ingreso ni actual ni anterior", async ({
    authenticatedPage: page,
    adminClient,
    coupleId,
  }) => {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
    if (!testUser) throw new Error("Test user not found");

    // Remove income for both months
    await adminClient
      .from("incomes")
      .delete()
      .eq("couple_id", coupleId)
      .eq("user_id", testUser.id)
      .in("month", [getMonthDate(), getPreviousMonthDate()]);

    await page.goto("/settings");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    await expect(page.getByText(/Igual al mes pasado/i)).not.toBeVisible({
      timeout: 5_000,
    });
  });
});
