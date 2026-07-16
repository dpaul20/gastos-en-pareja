import { test, expect } from "./fixtures";

/**
 * "sin factura" trigger + data layer E2E — PR2 (Phase 2a).
 *
 * PR2 ships NO user-reachable way to flag a template `awaits_bill` (the
 * checkbox in EditServiceSheet is PR3, paired with the row treatment that
 * makes an AWAITING_BILL instance legible instead of rendering as a bare,
 * editable "$0"). So these tests seed `awaits_bill` directly via
 * `adminClient` — the same pattern `fixed-review.spec.ts` already uses for
 * `requires_monthly_review` — and assert the real, reachable side effect:
 * `ensureFixedExpenseInstances` (wired to dashboard mount for the CURRENT
 * month only) materializes the new month's instance as AWAITING_BILL.
 *
 * `markFixedExpenseInstanceAwaitingBill` and `loadFixedExpenseBill` (the
 * per-instance override + "Cargar factura" actions) have no UI trigger in
 * PR2 either — they are exercised once PR3 wires the row treatment / load
 * -bill sheet that calls them.
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

async function seedTemplate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches fixed-review.spec.ts's adminClient param typing
  adminClient: any,
  coupleId: string,
  description: string,
  opts: { awaits_bill: boolean; requires_monthly_review?: boolean },
) {
  const { data: template, error } = await adminClient
    .from("fixed_expense_templates")
    .insert({
      couple_id: coupleId,
      description,
      amount: 72_375,
      due_day: 25,
      requires_monthly_review: opts.requires_monthly_review ?? false,
      awaits_bill: opts.awaits_bill,
      created_at: templateCreatedAt(),
    })
    .select("id")
    .single();
  if (error || !template)
    throw new Error(`Template seed failed: ${error?.message}`);
  return template.id as string;
}

test.describe("PR2: awaits_bill precedence in ensureFixedExpenseInstances", () => {
  const DESC = `E2E-awaits-bill-${Date.now()}`;
  let templateId: string;

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

  test("template con awaits_bill=true genera la instancia del mes como AWAITING_BILL", async ({
    authenticatedPage: page,
    adminClient,
    coupleId,
  }) => {
    test.slow();
    templateId = await seedTemplate(adminClient, coupleId, DESC, {
      awaits_bill: true,
    });

    await page.goto("/dashboard");
    // Real, visible signal that ensureFixedExpenseInstances finished this
    // mount's mutation — same banner happy-path/fixed-review rely on.
    await expect(page.getByText(/gasto.*fijo.*generado/i)).toBeVisible({
      timeout: 12_000,
    });

    const { data: instance } = await adminClient
      .from("fixed_expense_instances")
      .select("status, amount_override")
      .eq("template_id", templateId)
      .eq("month", currentMonth())
      .single();

    expect(instance?.status).toBe("AWAITING_BILL");
    // Never fabricate an amount for an instance whose bill hasn't arrived.
    expect(instance?.amount_override).toBeNull();
  });

  test("awaits_bill=true tiene precedencia sobre requires_monthly_review=true (no PENDING_CONFIRMATION)", async ({
    authenticatedPage: page,
    adminClient,
    coupleId,
  }) => {
    test.slow();
    templateId = await seedTemplate(adminClient, coupleId, `${DESC}-both`, {
      awaits_bill: true,
      requires_monthly_review: true,
    });

    await page.goto("/dashboard");
    await expect(page.getByText(/gasto.*fijo.*generado/i)).toBeVisible({
      timeout: 12_000,
    });

    const { data: instance } = await adminClient
      .from("fixed_expense_instances")
      .select("status")
      .eq("template_id", templateId)
      .eq("month", currentMonth())
      .single();

    expect(instance?.status).toBe("AWAITING_BILL");
  });
});

/**
 * PR3 (Phase 2b) — closes PR2's coverage gap: the two actions above (plus
 * the checkbox that flips a template's `awaits_bill`) now have real UI
 * triggers (row, EditServiceSheet, LoadBillSheet), so this exercises them
 * end-to-end for the first time, including the PR2 fix-batch hardening
 * (state-machine guard, stale-field clearing on revert).
 */

test.describe("PR3: checkbox 'Hay que esperar la factura' persiste awaits_bill", () => {
  const DESC = `E2E-awaits-checkbox-${Date.now()}`;
  let templateId: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    templateId = await seedTemplate(adminClient, coupleId, DESC, {
      awaits_bill: false,
    });
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

  test("activar el toggle en EditServiceSheet persiste awaits_bill=true en el template", async ({
    authenticatedPage: page,
    adminClient,
  }) => {
    test.slow();
    await page.goto("/dashboard");
    await expect(page.getByText(/gasto.*fijo.*generado/i)).toBeVisible({
      timeout: 12_000,
    });

    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();
    await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });

    await page
      .getByRole("button", { name: "Editar día de vencimiento" })
      .first()
      .click();
    await page.getByTestId("edit-service-sheet").waitFor({ state: "visible" });

    const toggle = page.getByTestId("toggle-awaits-bill");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");

    await expect
      .poll(
        async () => {
          const { data } = await adminClient
            .from("fixed_expense_templates")
            .select("awaits_bill")
            .eq("id", templateId)
            .single();
          return data?.awaits_bill;
        },
        { timeout: 8_000 },
      )
      .toBe(true);
  });
});

test.describe("PR3: 'Marcar sin factura este mes' (per-instance override, state-machine guard)", () => {
  const DESC = `E2E-mark-awaiting-${Date.now()}`;
  let templateId: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    templateId = await seedTemplate(adminClient, coupleId, DESC, {
      awaits_bill: false,
    });
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

  test("el botón transiciona la instancia y desaparece una vez AWAITING_BILL (guard estructural)", async ({
    authenticatedPage: page,
  }) => {
    test.slow();
    await page.goto("/dashboard");
    await expect(page.getByText(/gasto.*fijo.*generado/i)).toBeVisible({
      timeout: 12_000,
    });

    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();
    await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });

    await page
      .getByRole("button", { name: "Editar día de vencimiento" })
      .first()
      .click();
    await page.getByTestId("edit-service-sheet").waitFor({ state: "visible" });
    await page.getByTestId("mark-awaiting-bill").click();
    await page.getByTestId("edit-service-sheet").waitFor({ state: "hidden" });

    await expect(page.getByText("sin monto")).toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByTestId("fijo-item-awaiting").getByText("sin factura"),
    ).toBeVisible();

    // Reopen — the row is now AWAITING_BILL, so its own due-day link routes
    // back into the same sheet; the "mark awaiting" button must be GONE
    // (canMarkAwaitingBill's guard, enforced structurally in the UI too —
    // there is nothing left to revert).
    await page
      .getByRole("button", { name: "Editar día de vencimiento" })
      .first()
      .click();
    await page.getByTestId("edit-service-sheet").waitFor({ state: "visible" });
    await expect(page.getByTestId("mark-awaiting-bill")).toHaveCount(0);
    // The AWAITING_BILL CTA replaces the amount field.
    await expect(page.getByText("Cargar factura")).toBeVisible();
  });
});

test.describe("PR3: 'Cargar factura' sheet (loadFixedExpenseBill UI trigger)", () => {
  const DESC = `E2E-load-bill-${Date.now()}`;
  let templateId: string;

  test.beforeEach(async ({ adminClient, coupleId }) => {
    templateId = await seedTemplate(adminClient, coupleId, DESC, {
      awaits_bill: true,
    });
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

  test("cargar un monto válido pasa la fila a contada, con el pill 'nuevo'; un monto sobre el techo se rechaza", async ({
    authenticatedPage: page,
    testUserId,
  }) => {
    test.slow();
    await page.goto("/dashboard");
    await expect(page.getByText(/gasto.*fijo.*generado/i)).toBeVisible({
      timeout: 12_000,
    });

    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();
    await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("sin monto")).toBeVisible();

    await page.getByTestId("open-load-bill").click();
    await page.getByTestId("load-bill-sheet").waitFor({ state: "visible" });

    // Ceiling guard (isValidBillAmount / MAX_BILL_AMOUNT) — rejected
    // client-side, the action is never called.
    await page.getByTestId("load-bill-amount").fill("50000000");
    await page.getByTestId("load-bill-submit").click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByTestId("load-bill-sheet")).toBeVisible();

    await page.getByTestId("load-bill-amount").fill("72375");
    const payerSelector = page.getByTestId("load-bill-payer-selector");
    if (await payerSelector.isVisible()) {
      await page.getByTestId(`load-bill-payer-${testUserId}`).click();
    }
    await page.getByTestId("load-bill-submit").click();
    await page.getByTestId("load-bill-sheet").waitFor({ state: "hidden" });

    await expect(
      page.getByRole("button", { name: "Editar monto" }),
    ).toContainText("$72.375", { timeout: 8_000 });
    await expect(page.getByText("nuevo")).toBeVisible();
    await expect(page.getByTestId("fijo-item-awaiting")).toHaveCount(0);
  });
});

test.describe("PR3: revertir a sin factura limpia campos obsoletos (PR2 fix-batch hardening)", () => {
  const DESC = `E2E-revert-clears-${Date.now()}`;
  let templateId: string;
  let instanceId: string;

  test.beforeEach(async ({ adminClient, coupleId, testUserId }) => {
    templateId = await seedTemplate(adminClient, coupleId, DESC, {
      awaits_bill: false,
    });
    // Seed an already-billed, paid, recently-billed instance directly —
    // simulates the state a real "Cargar factura" would have left, so the
    // revert path has real stale fields to clear.
    const { data: instance, error } = await adminClient
      .from("fixed_expense_instances")
      .insert({
        template_id: templateId,
        couple_id: coupleId,
        month: currentMonth(),
        paid: true,
        paid_by_user_id: testUserId,
        amount_override: 72_375,
        status: "CONFIRMED",
        billed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !instance)
      throw new Error(`Instance seed failed: ${error?.message}`);
    instanceId = instance.id;
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

  test("la fila muestra 'nuevo' antes de revertir, y tras 'Marcar sin factura' limpia amount_override/paid/paid_by_user_id/billed_at", async ({
    authenticatedPage: page,
    adminClient,
  }) => {
    test.slow();
    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();
    await expect(page.getByText(DESC)).toBeVisible({ timeout: 10_000 });
    // Real (not unit-mocked) confirmation of shouldShowNuevoPill's status +
    // window gate against a genuinely seeded row.
    await expect(page.getByText("nuevo")).toBeVisible();

    await page
      .getByRole("button", { name: "Editar día de vencimiento" })
      .first()
      .click();
    await page.getByTestId("edit-service-sheet").waitFor({ state: "visible" });
    await page.getByTestId("mark-awaiting-bill").click();
    await page.getByTestId("edit-service-sheet").waitFor({ state: "hidden" });

    await expect(page.getByText("sin monto")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("nuevo")).toHaveCount(0);

    const { data: reverted } = await adminClient
      .from("fixed_expense_instances")
      .select("status, amount_override, paid, paid_by_user_id, billed_at")
      .eq("id", instanceId)
      .single();

    expect(reverted?.status).toBe("AWAITING_BILL");
    expect(reverted?.amount_override).toBeNull();
    expect(reverted?.paid).toBe(false);
    expect(reverted?.paid_by_user_id).toBeNull();
    expect(reverted?.billed_at).toBeNull();
  });
});
