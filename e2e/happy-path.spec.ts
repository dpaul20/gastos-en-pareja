import { test, expect } from "./fixtures";
import { BottomNav } from "./pages/nav.page";
import { ExpensesPage } from "./pages/expenses.page";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, TEST_EMAIL } from "./config";

/**
 * Golden path E2E — usuario autenticado.
 *
 * Cada test:
 * - Usa el fixture `authenticatedPage` (contexto aislado con auth.json)
 * - Limpia sus propios datos via adminClient en afterEach
 * - Verifica estado real, no sólo visibilidad
 *
 * Requiere: npm run dev + supabase start
 */

// ── Entry point ────────────────────────────────────────────────────────────────

test.describe("Raíz — usuario autenticado", () => {
  test("GET / redirige a /dashboard", async ({ authenticatedPage: page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  });
});

// ── Dashboard ──────────────────────────────────────────────────────────────────

test.describe("Dashboard", () => {
  test("muestra el encabezado de balance del mes", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard");
    // Esperar a que TanStack Query termine de cargar los datos del servidor
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    // El heading "Balance" debe existir y ser de nivel heading semánticamente
    const balanceHeading = page.getByRole("heading", { name: /balance/i });
    await expect(balanceHeading).toBeVisible({ timeout: 10_000 });
  });

  test("navegar al mes anterior cambia la URL o el estado", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard");
    // Esperar a que TanStack Query termine de cargar los datos del servidor
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    // El MonthHeader muestra el mes actual en un span con data-testid
    const monthLabel = page.getByTestId("current-month");
    await monthLabel.waitFor({ state: "visible", timeout: 10_000 });

    const initialMonth = await monthLabel.textContent();

    // Clickear "Mes anterior" — cambia state inmediatamente (sin esperar datos)
    await page.getByRole("button", { name: "Mes anterior" }).click();

    // El span debe mostrar un mes distinto
    await expect(monthLabel).not.toHaveText(initialMonth ?? "", {
      timeout: 3_000,
    });
  });
});

// ── Sidebar Navigation ─────────────────────────────────────────────────────────

test.describe("Sidebar Nav", () => {
  test("contiene los 4 destinos requeridos", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard");
    const nav = new BottomNav(page);
    await nav.openIfMobile();

    await expect(nav.link("Inicio")).toBeVisible();
    await expect(nav.link("Gastos")).toBeVisible();
    await expect(nav.link("Historial")).toBeVisible();
    await expect(nav.link("Configuración")).toBeVisible();
  });

  test("el link activo tiene aria-current='page'", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard");
    const nav = new BottomNav(page);

    const active = await nav.activePage();
    expect(active).toBe("Inicio");
  });

  test.describe("navegación", () => {
    for (const [label, expectedPath] of [
      ["Gastos", "/expenses"],
      ["Historial", "/history"],
      ["Configuración", "/settings"],
      ["Inicio", "/dashboard"],
    ] as const) {
      test(`click en "${label}" navega a ${expectedPath}`, async ({
        authenticatedPage: page,
      }) => {
        await page.goto("/dashboard");
        const nav = new BottomNav(page);
        await nav.navigateTo(label);
        await expect(page).toHaveURL(new RegExp(expectedPath));
      });
    }
  });
});

// ── Expenses — estructura de UI ────────────────────────────────────────────────

test.describe("Expenses — tabs del segmented control", () => {
  test("las 3 tabs se renderizan como botones accesibles", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();

    await expect(expenses.tabButton("Cuotas")).toBeVisible();
    await expect(expenses.tabButton("Servicios")).toBeVisible();
    await expect(expenses.tabButton("Compras")).toBeVisible();
  });

  test("el dialog de Compras tiene los campos correctos", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Compras");
    await expenses.openAddSheet();

    // Verificar que los campos esperados existen con sus labels accesibles
    await expect(expenses.dialogField("Descripción")).toBeVisible();
    await expect(expenses.dialogField("Monto")).toBeVisible();
    await expect(expenses.dialogField("Fecha (AAAA-MM-DD)")).toBeVisible();

    // El dialog title anuncia el tipo de gasto
    await expect(
      expenses.dialog().getByText("Nuevo gasto — Compras"),
    ).toBeVisible();
  });

  test("el dialog de Cuotas tiene los campos específicos de cuotas", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    // Cuotas es el tab inicial
    await expenses.openAddSheet();

    await expect(expenses.dialogField("Monto total")).toBeVisible();
    await expect(expenses.dialogField("Cuotas")).toBeVisible();
    await expect(expenses.dialogField("Fecha del primer pago")).toBeVisible();
  });

  test("el dialog de Servicios tiene el campo de vencimiento", async ({
    authenticatedPage: page,
  }) => {
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Servicios");
    await expenses.openAddSheet();

    await expect(
      expenses.dialogField("Día de vencimiento (1-31)"),
    ).toBeVisible();
  });
});

// ── Expenses — CRUD ────────────────────────────────────────────────────────────

test.describe("Expenses — creación de gasto variable", () => {
  // Limpieza de datos creados durante el test
  const DESCRIPCION_TEST = `E2E-variable-${Date.now()}`;

  test.afterEach(async ({ adminClient, coupleId }) => {
    // Eliminar el gasto de prueba para no contaminar runs posteriores
    await adminClient
      .from("variable_expenses")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-variable-%");
  });

  test("agrega un gasto variable y aparece en la lista", async ({
    authenticatedPage: page,
  }) => {
    // El flujo completo (nav + form fill + server action + refetch) necesita más tiempo en CI
    test.slow();
    const expenses = new ExpensesPage(page);
    await expenses.goto();
    await expenses.selectTab("Compras");

    await test.step("abrir el formulario", async () => {
      await expenses.openAddSheet();
      await expect(
        expenses.dialog().getByText("Nuevo gasto — Compras"),
      ).toBeVisible();
    });

    await test.step("completar campos con datos válidos", async () => {
      await expenses.dialogField("Descripción").fill(DESCRIPCION_TEST);
      // Verificar que el valor fue cargado correctamente
      await expect(expenses.dialogField("Descripción")).toHaveValue(
        DESCRIPCION_TEST,
      );

      await expenses.dialogField("Monto").fill("1500");
      await expect(expenses.dialogField("Monto")).toHaveValue("1500");
    });

    await test.step("guardar y verificar que aparece en la lista", async () => {
      await expenses.saveButton().click();
      // El dialog debe cerrarse tras guardar exitosamente
      await expect(expenses.dialog()).not.toBeVisible({ timeout: 5_000 });
      // El item debe aparecer en la lista
      await expect(expenses.itemByDescription(DESCRIPCION_TEST)).toBeVisible({
        timeout: 15_000,
      });
    });
  });
});

// ── Dashboard — balance proporcional ─────────────────────────────────────────

test.describe("Dashboard — balance proporcional", () => {
  // We create a temporary partner user to have two incomes in the couple
  const PARTNER_EMAIL = "e2e-partner-balance@gastospareja.local";
  // NOSONAR: test-only password, never used in production
  const PARTNER_PASSWORD = "Test1234!"; // NOSONAR
  const EXPENSE_DESC = `E2E-balance-math-${Date.now()}`;
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  let testUserId: string;
  let partnerUserId: string;

  test.beforeAll(async () => {
    const admin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find testUser
    const { data: users } = await admin.auth.admin.listUsers();
    const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
    if (!testUser) throw new Error("Test user not found");
    testUserId = testUser.id;

    // Resolve coupleId for testUser
    const { data: member } = await admin
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", testUserId)
      .single();
    if (!member) throw new Error("Test user has no couple");
    const coupleId = member.couple_id;

    // Clean up any existing partner from prior runs
    const existingPartner = users?.users.find((u) => u.email === PARTNER_EMAIL);
    if (existingPartner) {
      await admin
        .from("couple_members")
        .delete()
        .eq("user_id", existingPartner.id);
      await admin.auth.admin.deleteUser(existingPartner.id);
    }

    // Create partner user
    const { data: newPartner } = await admin.auth.admin.createUser({
      email: PARTNER_EMAIL,
      password: PARTNER_PASSWORD,
      email_confirm: true,
    });
    if (!newPartner?.user) throw new Error("Could not create partner user");
    partnerUserId = newPartner.user.id;

    // Add partner to the couple
    await admin.from("couple_members").insert({
      couple_id: coupleId,
      user_id: partnerUserId,
      role: "MEMBER",
    });
  });

  test.afterAll(async () => {
    const admin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    if (partnerUserId) {
      await admin.from("couple_members").delete().eq("user_id", partnerUserId);
      await admin.auth.admin.deleteUser(partnerUserId);
    }
  });

  test.beforeEach(async ({ adminClient, coupleId }) => {
    // Remove any fixed expense instances for this month so parallel tests in expenses.spec.ts
    // don't contaminate the balance calculation (shared coupleId + workers:2 in CI)
    await adminClient
      .from("fixed_expense_instances")
      .delete()
      .eq("couple_id", coupleId)
      .eq("month", currentMonth);
  });

  test.afterEach(async ({ adminClient, coupleId }) => {
    // Clean incomes for both users for current month
    await adminClient
      .from("incomes")
      .delete()
      .eq("couple_id", coupleId)
      .eq("month", currentMonth)
      .in("user_id", [testUserId, partnerUserId].filter(Boolean));
    // Clean the variable expense
    await adminClient
      .from("variable_expenses")
      .delete()
      .eq("couple_id", coupleId)
      .like("description", "E2E-balance-math-%");
    // Clean any fixed expense instances created by ensureFixedExpenseInstances during dashboard load
    await adminClient
      .from("fixed_expense_instances")
      .delete()
      .eq("couple_id", coupleId)
      .eq("month", currentMonth);
  });

  test("TC-007: balance-debt-amount refleja el split proporcional", async ({
    adminClient,
    coupleId,
    authenticatedPage: page,
  }) => {
    test.slow();

    // Seed incomes: testUser 100k, partner 50k
    await adminClient.from("incomes").upsert(
      [
        {
          couple_id: coupleId,
          user_id: testUserId,
          amount: 100_000,
          month: currentMonth,
        },
        {
          couple_id: coupleId,
          user_id: partnerUserId,
          amount: 50_000,
          month: currentMonth,
        },
      ],
      { onConflict: "couple_id,user_id,month" },
    );

    // Seed a shared variable expense paid by testUser (30k)
    // date = today so it falls in current month
    const today = new Date().toISOString().split("T")[0];
    await adminClient.from("variable_expenses").insert({
      couple_id: coupleId,
      user_id: testUserId,
      description: EXPENSE_DESC,
      amount: 30_000,
      date: today,
      is_shared: true,
    });

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    // balance-debt-amount must be visible
    const debtEl = page.getByTestId("balance-debt-amount");
    await expect(debtEl).toBeVisible({ timeout: 10_000 });

    // Verify it shows a non-zero ARS amount (contains "$" and a digit)
    const text = await debtEl.textContent();
    expect(text).toMatch(/\$[\d.]+/);

    // The expected debtAmount: partner owes 10000 (10% of 30k shared expense is
    // partner's obligation minus their paid = 0-10000 = -10000, abs = 10000)
    // formatARS(10000) = "$10.000"
    expect(text).toContain("$10.000");
  });

  // PR5 (settlements-and-pending-bills, Phase 4a): closes the boundary
  // PR3's load-bill-sheet.tsx left open — previewBillImpact's reopen
  // warning, wired here for the first time. Reuses this describe's
  // partner/income seeding (same TC-007 shape: Deivy 100k, partner 50k) so
  // the 30k shared expense creates the same 10k debt, which is then settled
  // in full BEFORE the bill loads — the exact "saldado, then a bill
  // arrives" scenario the warning exists for.
  test("PR5: 'Cargar factura' avisa cuando reabre un mes ya saldado", async ({
    adminClient,
    coupleId,
    authenticatedPage: page,
  }) => {
    test.slow();
    const BILL_DESC = `E2E-reopen-warning-${Date.now()}`;
    let billTemplateId: string | null = null;

    await adminClient.from("incomes").upsert(
      [
        {
          couple_id: coupleId,
          user_id: testUserId,
          amount: 100_000,
          month: currentMonth,
        },
        {
          couple_id: coupleId,
          user_id: partnerUserId,
          amount: 50_000,
          month: currentMonth,
        },
      ],
      { onConflict: "couple_id,user_id,month" },
    );

    const today = new Date().toISOString().split("T")[0];
    await adminClient.from("variable_expenses").insert({
      couple_id: coupleId,
      user_id: testUserId,
      description: `${BILL_DESC}-expense`,
      amount: 30_000,
      date: today,
      is_shared: true,
    });

    // Settle the 10k debt in full — the month is now "saldado"
    // (remainingDebt = 0) BEFORE the bill below is loaded.
    await adminClient.from("settlements").insert({
      couple_id: coupleId,
      month: currentMonth,
      from_user_id: partnerUserId,
      to_user_id: testUserId,
      amount: 10_000,
      paid_on: today,
      created_by: testUserId,
    });

    const { data: template, error: templateError } = await adminClient
      .from("fixed_expense_templates")
      .insert({
        couple_id: coupleId,
        description: BILL_DESC,
        amount: 6_000,
        due_day: 10,
        awaits_bill: true,
        is_shared: true,
      })
      .select("id")
      .single();
    if (templateError || !template) {
      throw new Error(`Template seed failed: ${templateError?.message}`);
    }
    billTemplateId = template.id;

    await adminClient.from("fixed_expense_instances").insert({
      template_id: template.id,
      couple_id: coupleId,
      month: currentMonth,
      paid: false,
      status: "AWAITING_BILL",
    });

    try {
      await page.goto("/expenses");
      await page.getByTestId("tab-servicios").click();
      await expect(page.getByText(BILL_DESC)).toBeVisible({ timeout: 10_000 });

      await page.getByTestId("open-load-bill").click();
      await page.getByTestId("load-bill-sheet").waitFor({ state: "visible" });

      // A $6.000 bill on a shared, fully-unpaid instance shifts the
      // proportional split enough to flip the debtor and reopen a 2.000
      // difference — see the matching Vitest fixture in settlement.test.ts
      // for the worked math.
      await page.getByTestId("load-bill-amount").fill("6000");

      const warning = page.getByTestId("load-bill-impact-warning");
      await expect(warning).toBeVisible({ timeout: 5_000 });
      await expect(warning).toContainText("$2.000");
    } finally {
      await adminClient
        .from("fixed_expense_instances")
        .delete()
        .eq("template_id", billTemplateId);
      await adminClient
        .from("fixed_expense_templates")
        .delete()
        .eq("id", billTemplateId);
      await adminClient
        .from("settlements")
        .delete()
        .eq("couple_id", coupleId)
        .eq("month", currentMonth);
      await adminClient
        .from("variable_expenses")
        .delete()
        .eq("couple_id", coupleId)
        .eq("description", `${BILL_DESC}-expense`);
    }
  });
});

// ── Dashboard — navegación de mes recarga datos ───────────────────────────────

test.describe("Dashboard — navegación de mes recarga datos", () => {
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  const prevDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1,
  );
  const previousMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-01`;
  let testUserId: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
    if (!testUser) throw new Error("Test user not found");
    testUserId = testUser.id;

    // Ensure no income for previous month
    await adminClient
      .from("incomes")
      .delete()
      .eq("couple_id", coupleId)
      .eq("user_id", testUserId)
      .eq("month", previousMonth);

    // Seed unique income for current month only
    await adminClient.from("incomes").upsert(
      {
        couple_id: coupleId,
        user_id: testUserId,
        amount: 123_456,
        month: currentMonth,
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

  test("TC-008: navegar al mes anterior no muestra datos del mes actual", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    const monthLabel = page.getByTestId("current-month");
    await monthLabel.waitFor({ state: "visible", timeout: 10_000 });
    const initialMonth = await monthLabel.textContent();

    // Navigate to previous month
    await page.getByRole("button", { name: "Mes anterior" }).click();
    await page.waitForLoadState("networkidle", { timeout: 8_000 });

    // Month label must change
    await expect(monthLabel).not.toHaveText(initialMonth ?? "", {
      timeout: 5_000,
    });

    // The unique amount seeded for current month must NOT appear in previous month
    // formatARS(123_456) = "$123.456"
    await expect(page.getByText("$123.456")).not.toBeVisible({
      timeout: 3_000,
    });
  });
});

// ── Sign out ───────────────────────────────────────────────────────────────────

test.describe("Cerrar sesión", () => {
  test("redirige a /login y ya no se puede acceder a rutas protegidas", async ({
    authenticatedPage: page,
    browser,
  }) => {
    await page.goto("/settings");
    // El botón "Cerrar sesión" debe existir como botón accesible
    const logoutBtn = page.getByRole("button", { name: /cerrar sesión/i });
    await expect(logoutBtn).toBeVisible();

    await logoutBtn.click();

    // Post-logout: la URL debe ser /login
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });

    // Una ruta protegida ya no es accesible con esta sesión
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    // Restore auth.json — sign-out revokes the session server-side, which
    // would break subsequent tests that load the same storage state.
    const freshCtx = await browser.newContext({
      baseURL: "http://localhost:3000",
    });
    const freshPage = await freshCtx.newPage();
    const res = await freshPage.request.post("/api/test/sign-in", {
      headers: { "Content-Type": "application/json" },
      data: { email: "test@gastospareja.local", password: "Test1234!" },
    });
    if (res.ok()) {
      await freshCtx.storageState({ path: "e2e/auth.json" });
    }
    await freshCtx.close();
  });
});
