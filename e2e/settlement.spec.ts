import { test, expect } from "./fixtures";

/**
 * Settlements — "Registrar pago" end-to-end (PR6a).
 *
 * This is the test the whole feature was missing. R1-001 (a service-client
 * bug that rejected EVERY real settlement) shipped green because NO e2e ever
 * had a SECOND couple member — a settlement's other party. Here we seed a
 * real partner, create a debt, and drive `createSettlement` THROUGH THE UI
 * (not service-role seeding), so the action's member validation actually
 * runs against a two-member couple. If R1-001 regresses, the submit throws
 * "La persona seleccionada no pertenece a esta pareja" and this fails.
 *
 * The suite shares one couple with a single member; `couple_members` is never
 * mutated by other specs. Since `workers: 1` + `fullyParallel: false`, adding
 * a transient partner in `beforeEach` and removing it in `afterEach` is safe.
 */

/** Current month as YYYY-MM-01 (matches getMonthDate()). */
const currentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

/** A date inside the current month, for the shared expense. */
const dateInMonth = (day: number): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

test.describe("PR6a: registrar pago entre dos miembros reales", () => {
  const partnerEmail = `e2e-partner-${Date.now()}@gastospareja.local`;
  let partnerId: string;

  test.beforeEach(async ({ adminClient, coupleId, testUserId }) => {
    // Clear any leftover extra members from a prior failed run.
    await adminClient
      .from("couple_members")
      .delete()
      .eq("couple_id", coupleId)
      .neq("user_id", testUserId);

    const { data: created, error: cErr } =
      await adminClient.auth.admin.createUser({
        email: partnerEmail,
        password: "Test1234!",
        email_confirm: true,
        user_metadata: { full_name: "Annie Partner" },
      });
    if (cErr || !created?.user)
      throw new Error(`Partner seed failed: ${cErr?.message}`);
    partnerId = created.user.id;

    const { error: mErr } = await adminClient
      .from("couple_members")
      .insert({ couple_id: coupleId, user_id: partnerId, role: "MEMBER" });
    if (mErr) throw new Error(`Partner member seed failed: ${mErr.message}`);

    // 50/50 incomes so a shared expense splits evenly.
    const month = currentMonth();
    const { error: iErr } = await adminClient.from("incomes").insert([
      { couple_id: coupleId, user_id: testUserId, amount: 100_000, month },
      { couple_id: coupleId, user_id: partnerId, amount: 100_000, month },
    ]);
    if (iErr) throw new Error(`Income seed failed: ${iErr.message}`);

    // A $40.000 shared expense paid by the test user → the partner owes their
    // half ($20.000). Test user is creditor, partner is debtor.
    const { error: vErr } = await adminClient.from("variable_expenses").insert({
      couple_id: coupleId,
      user_id: testUserId,
      description: "Super compartido",
      amount: 40_000,
      date: dateInMonth(5),
      is_shared: true,
    });
    if (vErr) throw new Error(`Expense seed failed: ${vErr.message}`);
  });

  test.afterEach(async ({ adminClient, coupleId, testUserId }) => {
    await adminClient.from("settlements").delete().eq("couple_id", coupleId);
    await adminClient
      .from("couple_members")
      .delete()
      .eq("couple_id", coupleId)
      .neq("user_id", testUserId);
    if (partnerId) await adminClient.auth.admin.deleteUser(partnerId);
  });

  test("crea el settlement vía la UI y el balance queda saldado", async ({
    authenticatedPage: page,
    adminClient,
    coupleId,
    testUserId,
  }) => {
    test.slow();
    await page.goto("/dashboard");

    // The partner owes $20.000 — the debt headline and the CTA appear.
    await expect(page.getByTestId("balance-debt-amount")).toContainText(
      "$20.000",
      { timeout: 12_000 },
    );
    await page.getByTestId("register-payment").click();

    // Sheet opens with the amount pre-filled to exactly what's owed.
    const sheet = page.getByTestId("settle-sheet");
    await expect(sheet).toBeVisible();
    await expect(page.getByTestId("settle-amount")).toHaveValue("20000");

    await page.getByTestId("settle-submit").click();

    // Sheet closes and the month reads saldado ($0).
    await expect(sheet).toBeHidden({ timeout: 10_000 });
    await expect(page.getByTestId("balance-zero")).toBeVisible();

    // The settlement was persisted with the correct parties and amount —
    // debtor (partner) → creditor (test user). This only succeeds if the
    // action's service-client member validation accepted BOTH parties.
    await expect
      .poll(
        async () => {
          const { data } = await adminClient
            .from("settlements")
            .select("from_user_id, to_user_id, amount")
            .eq("couple_id", coupleId);
          return data ?? [];
        },
        { timeout: 8_000 },
      )
      .toEqual([
        {
          from_user_id: partnerId,
          to_user_id: testUserId,
          amount: 20_000,
        },
      ]);
  });
});
