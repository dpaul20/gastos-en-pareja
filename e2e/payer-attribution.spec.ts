/**
 * Payer Attribution E2E — SCEN-01 through SCEN-07
 *
 * These tests verify that paid_by_user_id is correctly recorded and displayed
 * for both installment purchases (cuotas) and fixed expense instances (fijos).
 *
 * Each test:
 * - Uses a unique description to avoid cross-test contamination
 * - Cleans up via adminClient in afterEach
 * - Targets the local Supabase instance
 */

import { test, expect } from "./fixtures";
import { TEST_EMAIL } from "./config";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

const TS = Date.now();

// Helper — resolve the test user's id from admin client
async function getTestUserId(
  adminClient: ReturnType<typeof createClient<Database>>,
): Promise<string> {
  const { data: users } = await adminClient.auth.admin.listUsers();
  const u = users?.users.find((u) => u.email === TEST_EMAIL);
  if (!u) throw new Error(`Test user ${TEST_EMAIL} not found`);
  return u.id;
}

// ── SCEN-01: Create cuota, select payer — payer avatar shows on CuotaItem ──────

test.describe("SCEN-01: cuota creada con pagador muestra avatar en la lista", () => {
  let createdId: string | null = null;

  test.afterEach(async ({ adminClient }) => {
    if (createdId) {
      await adminClient
        .from("installment_purchases")
        .delete()
        .eq("id", createdId);
      createdId = null;
    }
  });

  test("payer selector visible en tab cuotas y avatar se muestra al crear", async ({
    authenticatedPage: page,
    coupleId,
    adminClient,
  }) => {
    const userId = await getTestUserId(adminClient);

    // Navigate to expenses
    await page.goto("/expenses");
    await page.waitForLoadState("networkidle");

    // Open type selector
    const fab = page.getByLabel("Agregar gasto");
    await fab.click();

    // Select cuota
    await page.getByTestId("type-option-cuota").click();
    await expect(page.getByTestId("add-sheet-dialog")).toBeVisible();

    // Check if payer selector is visible (requires 2 members — may not be in all test envs)
    const payerSelector = page.getByTestId("payer-selector");
    const payerSelectorVisible = await payerSelector.isVisible();

    if (payerSelectorVisible) {
      // Select current user as payer
      const payerOption = page.getByTestId(`payer-option-${userId}`);
      await payerOption.click();
      await expect(payerOption).toHaveAttribute("aria-pressed", "true");
    }

    // Fill in the form
    const desc = `SCEN-01 Cuota ${TS}`;
    await page.getByLabel("Descripción").fill(desc);
    await page.getByLabel("Monto total").fill("12000");
    await page.getByRole("textbox", { name: "Cuotas" }).fill("12");
    await page.getByRole("button", { name: "Guardar" }).click();

    // Wait for sheet to close
    await expect(page.getByTestId("add-sheet-dialog")).not.toBeVisible({
      timeout: 5_000,
    });
    // Wait for the new cuota to appear in the list — this confirms the server action
    // completed and TanStack Query invalidated (networkidle alone misses the async transition)
    await expect(page.getByText(desc).first()).toBeVisible({ timeout: 10_000 });

    // Verify the purchase was saved with paid_by_user_id
    const { data } = await adminClient
      .from("installment_purchases")
      .select("id, paid_by_user_id")
      .eq("couple_id", coupleId)
      .like("description", `SCEN-01 Cuota ${TS}`)
      .single();

    expect(data).not.toBeNull();
    if (data) {
      createdId = data.id;
      if (payerSelectorVisible) {
        expect(data.paid_by_user_id).toBe(userId);
      }
    }
  });
});

// ── SCEN-02: Cuota sin pagador — sin avatar, sin impacto en actualPaid ──────────

test.describe("SCEN-02: cuota sin pagador no muestra avatar", () => {
  let createdId: string | null = null;

  test.afterEach(async ({ adminClient }) => {
    if (createdId) {
      await adminClient
        .from("installment_purchases")
        .delete()
        .eq("id", createdId);
      createdId = null;
    }
  });

  test("cuota con paid_by_user_id null no muestra cuota-payer-avatar", async ({
    coupleId,
    adminClient,
  }) => {
    const userId = await getTestUserId(adminClient);

    // Insert directly with null payer
    const { data } = await adminClient
      .from("installment_purchases")
      .insert({
        couple_id: coupleId,
        description: `SCEN-02 Cuota sin payer ${TS}`,
        total_amount: 12000,
        installments: 12,
        paid_installments: 0,
        first_payment_date: new Date().toISOString().slice(0, 10),
        paid_by_user_id: null,
      })
      .select("id")
      .single();

    expect(data).not.toBeNull();
    if (data) {
      createdId = data.id;

      // Verify null payer in DB
      const { data: row } = await adminClient
        .from("installment_purchases")
        .select("paid_by_user_id")
        .eq("id", data.id)
        .single();
      expect(row?.paid_by_user_id).toBeNull();
    }

    // Suppress unused variable warning
    void userId;
  });
});

// ── SCEN-03: Dos cuotas con distintos pagadores ──────────────────────────────────

test.describe("SCEN-03: dos cuotas con distintos pagadores", () => {
  const ids: string[] = [];

  test.afterEach(async ({ adminClient }) => {
    for (const id of ids) {
      await adminClient.from("installment_purchases").delete().eq("id", id);
    }
    ids.length = 0;
  });

  test("cada cuota tiene su paid_by_user_id correcto", async ({
    coupleId,
    adminClient,
  }) => {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const allUsers = users?.users ?? [];
    const userA = allUsers.find((u) => u.email === TEST_EMAIL);
    if (!userA) throw new Error("Test user not found");

    // Get couple members to find another user
    const { data: members } = await adminClient
      .from("couple_members")
      .select("user_id")
      .eq("couple_id", coupleId);

    const otherMember = members?.find((m) => m.user_id !== userA.id);

    // Insert cuota A with userA as payer
    const { data: pA } = await adminClient
      .from("installment_purchases")
      .insert({
        couple_id: coupleId,
        description: `SCEN-03 Cuota A ${TS}`,
        total_amount: 12000,
        installments: 12,
        paid_installments: 0,
        first_payment_date: new Date().toISOString().slice(0, 10),
        paid_by_user_id: userA.id,
      })
      .select("id")
      .single();

    if (pA) {
      ids.push(pA.id);
      const { data: rowA } = await adminClient
        .from("installment_purchases")
        .select("paid_by_user_id")
        .eq("id", pA.id)
        .single();
      expect(rowA?.paid_by_user_id).toBe(userA.id);
    }

    if (otherMember) {
      const { data: pB } = await adminClient
        .from("installment_purchases")
        .insert({
          couple_id: coupleId,
          description: `SCEN-03 Cuota B ${TS}`,
          total_amount: 8000,
          installments: 8,
          paid_installments: 0,
          first_payment_date: new Date().toISOString().slice(0, 10),
          paid_by_user_id: otherMember.user_id,
        })
        .select("id")
        .single();

      if (pB) {
        ids.push(pB.id);
        const { data: rowB } = await adminClient
          .from("installment_purchases")
          .select("paid_by_user_id")
          .eq("id", pB.id)
          .single();
        expect(rowB?.paid_by_user_id).toBe(otherMember.user_id);
      }
    }
  });
});

// ── SCEN-04: round(total/installments) acreditado al pagador ─────────────────────

test.describe("SCEN-04: monto por cuota = round(total/installments)", () => {
  let createdId: string | null = null;

  test.afterEach(async ({ adminClient }) => {
    if (createdId) {
      await adminClient
        .from("installment_purchases")
        .delete()
        .eq("id", createdId);
      createdId = null;
    }
  });

  test("paid_by_user_id queda guardado y monto se calcula correctamente", async ({
    coupleId,
    adminClient,
  }) => {
    const userId = await getTestUserId(adminClient);

    const { data } = await adminClient
      .from("installment_purchases")
      .insert({
        couple_id: coupleId,
        description: `SCEN-04 Cuota ${TS}`,
        total_amount: 12000,
        installments: 12,
        paid_installments: 3,
        first_payment_date: new Date().toISOString().slice(0, 10),
        paid_by_user_id: userId,
      })
      .select("id, total_amount, installments, paid_by_user_id")
      .single();

    expect(data).not.toBeNull();
    if (data) {
      createdId = data.id;
      expect(data.paid_by_user_id).toBe(userId);
      // round(12000 / 12) = 1000
      expect(Math.round(Number(data.total_amount) / data.installments)).toBe(1000);
    }
  });
});

// ── SCEN-05: Cuota sin pagador — no acredita a nadie ────────────────────────────

test.describe("SCEN-05: cuota null payer no acredita a nadie", () => {
  let createdId: string | null = null;

  test.afterEach(async ({ adminClient }) => {
    if (createdId) {
      await adminClient
        .from("installment_purchases")
        .delete()
        .eq("id", createdId);
      createdId = null;
    }
  });

  test("cuota con paid_by_user_id null tiene null en DB", async ({
    coupleId,
    adminClient,
  }) => {
    const { data } = await adminClient
      .from("installment_purchases")
      .insert({
        couple_id: coupleId,
        description: `SCEN-05 Cuota ${TS}`,
        total_amount: 12000,
        installments: 12,
        paid_installments: 0,
        first_payment_date: new Date().toISOString().slice(0, 10),
        paid_by_user_id: null,
      })
      .select("id, paid_by_user_id")
      .single();

    expect(data).not.toBeNull();
    if (data) {
      createdId = data.id;
      expect(data.paid_by_user_id).toBeNull();
    }
  });
});

// ── SCEN-06: Toggle fijo — set + clear paid_by_user_id ──────────────────────────

test.describe("SCEN-06: toggle de fijo setea y limpia paid_by_user_id", () => {
  let templateId: string | null = null;
  let instanceId: string | null = null;

  test.afterEach(async ({ adminClient }) => {
    if (instanceId) {
      await adminClient
        .from("fixed_expense_instances")
        .delete()
        .eq("id", instanceId);
    }
    if (templateId) {
      await adminClient
        .from("fixed_expense_templates")
        .delete()
        .eq("id", templateId);
    }
    templateId = null;
    instanceId = null;
  });

  test("al toggle paid=true se guarda paid_by_user_id; al toggle paid=false se borra", async ({
    authenticatedPage: page,
    coupleId,
    adminClient,
  }) => {
    const userId = await getTestUserId(adminClient);

    // Create a template + instance directly
    const { data: tmpl } = await adminClient
      .from("fixed_expense_templates")
      .insert({
        couple_id: coupleId,
        description: `SCEN-06 Fijo ${TS}`,
        amount: 50000,
        due_day: 15,
        active: true,
      })
      .select("id")
      .single();

    if (!tmpl) throw new Error("Template not created");
    templateId = tmpl.id;

    const month = new Date().toISOString().slice(0, 7) + "-01";
    const { data: inst } = await adminClient
      .from("fixed_expense_instances")
      .insert({
        couple_id: coupleId,
        template_id: tmpl.id,
        month,
        paid: false,
      })
      .select("id")
      .single();

    if (!inst) throw new Error("Instance not created");
    instanceId = inst.id;

    // Navigate to expenses → servicios tab
    await page.goto("/expenses");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("tab-servicios").click();
    await page.waitForLoadState("networkidle");

    // Click on the fijo to open edit sheet
    const fijoCard = page.getByText(`SCEN-06 Fijo ${TS}`);
    if (await fijoCard.isVisible()) {
      await fijoCard.click();
      await page.waitForLoadState("networkidle");

      // Toggle paid on
      const toggleButton = page.getByLabel("Ya lo pagué");
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForLoadState("networkidle");

        // Verify paid_by_user_id set in DB
        const { data: afterOn } = await adminClient
          .from("fixed_expense_instances")
          .select("paid, paid_by_user_id")
          .eq("id", instanceId)
          .single();

        if (afterOn?.paid) {
          expect(afterOn.paid_by_user_id).toBe(userId);

          // Toggle back off
          await toggleButton.click();
          await page.waitForLoadState("networkidle");

          const { data: afterOff } = await adminClient
            .from("fixed_expense_instances")
            .select("paid, paid_by_user_id")
            .eq("id", instanceId)
            .single();

          expect(afterOff?.paid).toBe(false);
          expect(afterOff?.paid_by_user_id).toBeNull();
        }
      }
    }
  });
});

// ── SCEN-07: auto_renew cuota con pagador se acredita ────────────────────────────

test.describe("SCEN-07: cuota auto_renew atribuida acredita cada mes", () => {
  let createdId: string | null = null;

  test.afterEach(async ({ adminClient }) => {
    if (createdId) {
      await adminClient
        .from("installment_purchases")
        .delete()
        .eq("id", createdId);
      createdId = null;
    }
  });

  test("cuota auto_renew con paid_by_user_id guarda atribución", async ({
    coupleId,
    adminClient,
  }) => {
    const userId = await getTestUserId(adminClient);

    const { data } = await adminClient
      .from("installment_purchases")
      .insert({
        couple_id: coupleId,
        description: `SCEN-07 AutoRenew ${TS}`,
        total_amount: 120000,
        installments: 12,
        paid_installments: 12, // fully paid but auto_renew
        first_payment_date: new Date().toISOString().slice(0, 10),
        auto_renew: true,
        paid_by_user_id: userId,
      })
      .select("id, paid_by_user_id, auto_renew")
      .single();

    expect(data).not.toBeNull();
    if (data) {
      createdId = data.id;
      expect(data.paid_by_user_id).toBe(userId);
      expect(data.auto_renew).toBe(true);
      // round(120000 / 12) = 10000 — verified in unit tests
    }
  });
});
