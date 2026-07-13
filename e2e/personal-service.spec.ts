/**
 * Personal Fixed Expense (servicio propio) E2E
 *
 * Verifies the flow added alongside the dashboard due-day fix: a fixed expense
 * (servicio) can be created as personal — owned by one member and excluded from
 * the proportional split — mirroring the shared/personal toggle on compras.
 *
 * Flow: Servicios tab → Nuevo servicio → toggle "Gasto personal" → pick payer →
 * save → item shows the "Personal" badge → template persists is_shared=false and
 * owner_user_id.
 */

import { test, expect } from "./fixtures";
import { TEST_EMAIL } from "./config";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

const TS = Date.now();

async function getTestUserId(
  adminClient: ReturnType<typeof createClient<Database>>,
): Promise<string> {
  const { data: users } = await adminClient.auth.admin.listUsers();
  const u = users?.users.find((u) => u.email === TEST_EMAIL);
  if (!u) throw new Error(`Test user ${TEST_EMAIL} not found`);
  return u.id;
}

test.describe("Servicio personal: creación, badge y persistencia", () => {
  const desc = `E2E-servicio-personal-${TS}`;
  let createdTemplateId: string | null = null;

  test.afterEach(async ({ adminClient }) => {
    if (createdTemplateId) {
      await adminClient
        .from("fixed_expense_instances")
        .delete()
        .eq("template_id", createdTemplateId);
      await adminClient
        .from("fixed_expense_templates")
        .delete()
        .eq("id", createdTemplateId);
      createdTemplateId = null;
    }
  });

  test("crea un servicio propio con dueño y lo marca como Personal", async ({
    authenticatedPage: page,
    coupleId,
    adminClient,
  }) => {
    test.slow();
    const userId = await getTestUserId(adminClient);

    await page.goto("/expenses");
    await page.getByTestId("tab-servicios").click();

    // Servicios add flow: FAB → type selector → servicio → service list → nuevo
    await page.getByLabel("Agregar gasto").click();
    await page.getByTestId("type-option-servicio").click();
    await page.getByTestId("service-list-sheet").waitFor({ state: "visible" });
    await page.getByText("+ Nuevo servicio").click();
    const dialog = page.getByTestId("add-sheet-dialog");
    await expect(dialog).toBeVisible();

    // Fill the base fields (scoped to the dialog — the list behind it also has
    // "Monto"-labelled controls)
    await dialog.getByLabel("Descripción").fill(desc);
    await dialog.getByLabel("Monto").fill("30000");
    await dialog.getByTestId("field-due-day").fill("10");

    // Flip to shared → personal. The label reflects the new state immediately.
    await dialog.getByTestId("toggle-is-shared").click();
    await expect(dialog.getByText("Gasto personal")).toBeVisible();

    // The payer selector only renders for couples with 2+ members. With a single
    // member the owner defaults to the current user, so guard on visibility.
    const payerOption = dialog.getByTestId(`payer-option-${userId}`);
    if (await payerOption.isVisible()) {
      await payerOption.click();
      await expect(payerOption).toHaveAttribute("aria-pressed", "true");
    }

    await dialog.getByRole("button", { name: "Guardar" }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // The item shows in the list with the Personal badge
    const item = page.getByText(desc).first();
    await expect(item).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Personal").first()).toBeVisible();

    // Persisted as personal, owned by the payer
    const { data } = await adminClient
      .from("fixed_expense_templates")
      .select("id, is_shared, owner_user_id")
      .eq("couple_id", coupleId)
      .eq("description", desc)
      .single();

    expect(data).not.toBeNull();
    if (data) {
      createdTemplateId = data.id;
      expect(data.is_shared).toBe(false);
      expect(data.owner_user_id).toBe(userId);
    }
  });
});
