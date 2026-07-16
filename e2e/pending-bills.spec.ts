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
