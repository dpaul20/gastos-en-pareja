import { test, expect } from "./fixtures";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "./config";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

/**
 * Invitation Flow E2E — flujo completo de invitación.
 *
 * Estrategia: usamos el admin client para sembrar la DB directamente
 * y la API de test (/api/test/sign-in) para establecer la sesión del browser.
 * Este endpoint usa @supabase/ssr y garantiza que los cookies sean leídos
 * correctamente por los Server Components (como /invite/[token]).
 *
 * Precondición: el test user (test@gastospareja.local) tiene una pareja
 * activa (garantizada por global-setup). Creamos un segundo usuario de
 * prueba in-test vía admin API para simular el invitado.
 *
 * Requiere: npm run dev + supabase start
 */

const INVITEE_EMAIL = "invitee-e2e@gastospareja.local";
// NOSONAR: test-only password, never used in production
const INVITEE_PASSWORD = "Test1234!"; // NOSONAR

const TEST_EMAIL = "test@gastospareja.local";
// NOSONAR: test-only password, never used in production
const TEST_PASSWORD = "Test1234!"; // NOSONAR

test.describe("Flujo de invitación — camino feliz", () => {
  let inviteeUserId: string;
  let invitationToken: string;
  let coupleId: string;

  test.beforeAll(async () => {
    const admin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Limpiar invitado si existía de un run anterior
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existing = existingUsers?.users.find(
      (u) => u.email === INVITEE_EMAIL,
    );
    if (existing) {
      await admin.from("couple_members").delete().eq("user_id", existing.id);
      await admin.auth.admin.deleteUser(existing.id);
    }

    // Crear usuario invitado
    const { data: newUser, error: createError } =
      await admin.auth.admin.createUser({
        email: INVITEE_EMAIL,
        password: INVITEE_PASSWORD,
        email_confirm: true,
      });
    if (createError || !newUser?.user) {
      throw new Error(
        `No se pudo crear el usuario invitado: ${createError?.message}`,
      );
    }
    inviteeUserId = newUser.user.id;

    // Obtener el couple_id del usuario owner (test@gastospareja.local)
    const { data: testUsers } = await admin.auth.admin.listUsers();
    const owner = testUsers?.users.find((u) => u.email === TEST_EMAIL);
    if (!owner) throw new Error("Usuario owner no encontrado");

    const { data: membership } = await admin
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", owner.id)
      .single();
    if (!membership) throw new Error("El owner no tiene couple_member");
    coupleId = membership.couple_id;

    // Crear invitación directamente en la DB (bypassea el email)
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data: invitation, error: invErr } = await admin
      .from("invitations")
      .insert({
        couple_id: coupleId,
        inviter_id: owner.id,
        email: INVITEE_EMAIL,
        expires_at: expiresAt,
      })
      .select("token")
      .single();
    if (invErr || !invitation) {
      throw new Error(`No se pudo crear la invitación: ${invErr?.message}`);
    }
    invitationToken = invitation.token;
  });

  test.afterAll(async () => {
    const admin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    if (inviteeUserId) {
      await admin.from("couple_members").delete().eq("user_id", inviteeUserId);
      await admin.auth.admin.deleteUser(inviteeUserId);
    }
    if (coupleId) {
      await admin
        .from("invitations")
        .delete()
        .eq("couple_id", coupleId)
        .eq("email", INVITEE_EMAIL)
        .is("accepted_at", null);
    }
  });

  test("aceptar un token válido redirige al dashboard y activa la pareja", async ({
    browser,
  }) => {
    const admin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Autenticar al invitado vía la API de test (mismo mecanismo que globalSetup:
    // usa @supabase/ssr para setear cookies que los Server Components leen correctamente)
    const context = await browser.newContext({
      baseURL: "http://localhost:3000",
    });
    const page = await context.newPage();

    const signInResp = await page.request.post("/api/test/sign-in", {
      headers: { "Content-Type": "application/json" },
      data: { email: INVITEE_EMAIL, password: INVITEE_PASSWORD },
    });
    if (!signInResp.ok()) {
      await context.close();
      throw new Error(
        `Sign in del invitado falló: ${signInResp.status()} ${await signInResp.text()}`,
      );
    }

    // Navegar directamente al link de invitación (la sesión ya está establecida)
    await page.goto(`/invite/${invitationToken}`);

    // Debe redirigir al dashboard si la aceptación es exitosa
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    await context.close();

    // Verificar en la DB que la invitación fue aceptada y hay couple_member
    const { data: acceptedInv } = await admin
      .from("invitations")
      .select("accepted_at")
      .eq("token", invitationToken)
      .single();
    expect(acceptedInv?.accepted_at).not.toBeNull();

    const { data: member } = await admin
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", inviteeUserId)
      .single();
    expect(member?.couple_id).toBe(coupleId);
  });

  test("token inválido muestra el mensaje de error de invitación", async ({
    browser,
  }) => {
    // Crear contexto fresco y autenticar vía la API de test para garantizar
    // que las cookies de @supabase/ssr sean leídas correctamente por el Server Component
    const context = await browser.newContext({
      baseURL: "http://localhost:3000",
    });
    const page = await context.newPage();

    await page.request.post("/api/test/sign-in", {
      headers: { "Content-Type": "application/json" },
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    try {
      // Navegar con un token inexistente
      await page.goto("/invite/token-inexistente-xyz");

      // No debe redirigir al dashboard
      await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 5_000 });

      // Debe mostrar el mensaje de error
      await expect(
        page.getByText("Invitación inválida", { exact: true }),
      ).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await context.close();
    }
  });
});

test.describe("Flujo de invitación — casos adversariales", () => {
  test("usuario ya pertenece a una pareja — no puede aceptar una segunda invitación", async ({
    adminClient,
    browser,
  }) => {
    // El usuario test@gastospareja.local YA tiene pareja (global-setup la crea)
    const { data: users } = await adminClient.auth.admin.listUsers();
    const owner = users?.users.find((u) => u.email === TEST_EMAIL);
    if (!owner) throw new Error("Owner no encontrado");

    // Crear una segunda pareja para generar una invitación cruzada
    const { data: secondCouple } = await adminClient
      .from("couples")
      .insert({ status: "PENDING" })
      .select("id")
      .single();
    if (!secondCouple) throw new Error("No se pudo crear segunda pareja");

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data: inv } = await adminClient
      .from("invitations")
      .insert({
        couple_id: secondCouple.id,
        inviter_id: owner.id,
        email: TEST_EMAIL, // invitar al mismo usuario test
        expires_at: expiresAt,
      })
      .select("token")
      .single();
    if (!inv) throw new Error("No se pudo crear invitación para el test");

    // Crear contexto fresco y autenticar vía la API de test
    const context = await browser.newContext({
      baseURL: "http://localhost:3000",
    });
    const page = await context.newPage();

    await page.request.post("/api/test/sign-in", {
      headers: { "Content-Type": "application/json" },
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    try {
      await page.goto(`/invite/${inv.token}`);

      // Debe mostrar error porque el usuario ya tiene pareja
      await expect(
        page.getByText("Invitación inválida", { exact: true }),
      ).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await context.close();
      // Cleanup
      await adminClient.from("invitations").delete().eq("token", inv.token);
      await adminClient.from("couples").delete().eq("id", secondCouple.id);
    }
  });
});
