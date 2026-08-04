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

  // These three used to assert the MANUAL flow: land on Configuración with no
  // income for the month, get a "Igual al mes pasado" banner, click it, save.
  // `ensureIncomeCarriedForward` already existed for exactly this but ran only
  // on /dashboard, so arriving at Configuración first — which is what you do
  // when you come to check your sueldo — still demanded the manual re-entry.
  // Settings now runs the same carry, so the banner is a fallback the happy
  // path never reaches.

  test("arrastra el ingreso del mes anterior sin intervención al entrar", async ({
    authenticatedPage: page,
    adminClient,
    coupleId,
  }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    // The field is populated with the carried amount, already grouped.
    const incomeInput = page.getByPlaceholder("0");
    await expect(incomeInput).toHaveValue(
      previousAmount.toLocaleString("es-AR"),
      { timeout: 8_000 },
    );

    // And the row really exists for the current month — the carry persisted it,
    // no "Guardar ingreso" click involved.
    await expect
      .poll(
        async () => {
          const { data } = await adminClient
            .from("incomes")
            .select("amount")
            .eq("couple_id", coupleId)
            .eq("user_id", testUserId)
            .eq("month", currentMonth)
            .maybeSingle();
          return data ? Number(data.amount) : null;
        },
        { timeout: 8_000 },
      )
      .toBe(previousAmount);
  });

  test("no pide cargar el sueldo a mano cuando puede arrastrarlo", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    // Guard against regressing to the manual flow: once the carry lands there
    // is nothing to suggest, so the banner must not be on screen.
    await expect(page.getByPlaceholder("0")).toHaveValue(
      previousAmount.toLocaleString("es-AR"),
      { timeout: 8_000 },
    );
    await expect(page.getByText(/Igual al mes pasado/i)).toBeHidden();
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

// ── Income — validación de monto ──────────────────────────────────────────────

test.describe("Income — validación de monto", () => {
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  let testUserId: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
    if (!testUser) throw new Error("Test user not found");
    testUserId = testUser.id;

    // Ensure no income for current month before each test
    await adminClient
      .from("incomes")
      .delete()
      .eq("couple_id", coupleId)
      .eq("user_id", testUserId)
      .eq("month", currentMonth);
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    if (testUserId) {
      await adminClient
        .from("incomes")
        .delete()
        .eq("couple_id", coupleId)
        .eq("user_id", testUserId)
        .eq("month", currentMonth);
    }
  });

  test("TC-009: monto 0 no guarda el ingreso — botón queda deshabilitado", async ({
    authenticatedPage: page,
    adminClient,
    coupleId,
  }) => {
    test.slow();
    await page.goto("/settings");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    const incomeInput = page.getByPlaceholder("0");
    await incomeInput.fill("0");

    const saveBtn = page.getByRole("button", { name: "Guardar ingreso" });

    // Button must be disabled when amount is 0
    await expect(saveBtn).toBeDisabled({ timeout: 3_000 });

    // Verify no income row was created
    const { data } = await adminClient
      .from("incomes")
      .select("amount")
      .eq("couple_id", coupleId)
      .eq("user_id", testUserId)
      .eq("month", currentMonth);

    expect(data?.length ?? 0).toBe(0);
  });

  test("TC-010: actualizar ingreso sobreescribe el registro existente", async ({
    authenticatedPage: page,
    adminClient,
    coupleId,
  }) => {
    test.slow();

    // Seed current-month income of 100_000
    await adminClient.from("incomes").upsert(
      {
        couple_id: coupleId,
        user_id: testUserId,
        amount: 100_000,
        month: currentMonth,
      },
      { onConflict: "couple_id,user_id,month" },
    );

    await page.goto("/settings");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    // Input should pre-fill with the saved amount, already grouped.
    const incomeInput = page.getByPlaceholder("0");
    await expect(incomeInput).toHaveValue("100.000", { timeout: 5_000 });

    // Typing a bare number gets grouped on the way in; what reaches the DB is
    // still the plain 200000 (parseAmount strips the separators on submit).
    await incomeInput.fill("200000");
    await expect(incomeInput).toHaveValue("200.000");

    const saveBtn = page.getByRole("button", { name: "Guardar ingreso" });
    await saveBtn.click();

    // Wait for the Server Action to complete
    await expect(saveBtn).toBeEnabled({ timeout: 8_000 });

    // Verify exactly one row with amount 200000
    const { data } = await adminClient
      .from("incomes")
      .select("amount")
      .eq("couple_id", coupleId)
      .eq("user_id", testUserId)
      .eq("month", currentMonth);

    expect(data?.length).toBe(1);
    expect(Number(data?.[0]?.amount)).toBe(200_000);
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
