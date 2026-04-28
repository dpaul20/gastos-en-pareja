import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Local dev values — safe to commit (only work against http://127.0.0.1:54321)
const SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY =
  process.env.E2E_SUPABASE_SERVICE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0MDAwMDAwMCwiZXhwIjoxOTgzODEyOTk2fQ.UTtkogysuF6fIO9e0N2rZeyhN4t33YHYny4OIa7yf08";

// Test user credentials — used only against local Supabase, not production
const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "test@gastospareja.local";
// NOSONAR: test-only password, never used in production
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "Test1234!"; // NOSONAR

export default async function globalSetup(_config: FullConfig) {
  // 1. Ensure test couple exists in local DB
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: users } = await admin.auth.admin.listUsers();
  const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
  if (!testUser)
    throw new Error(
      `Test user ${TEST_EMAIL} not found. Run the setup script first.`,
    );

  const userId = testUser.id;
  const { data: existing } = await admin
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", userId)
    .single();

  if (!existing) {
    const { data: couple } = await admin
      .from("couples")
      .insert({ status: "ACTIVE" })
      .select()
      .single();
    if (couple) {
      await admin
        .from("couple_members")
        .insert({ couple_id: couple.id, user_id: userId, role: "OWNER" });
    }
  } else {
    await admin
      .from("couples")
      .update({ status: "ACTIVE" })
      .eq("id", existing.couple_id);
  }

  // 2. Sign in via the dev-only test endpoint (lets @supabase/ssr set cookies naturally)
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: "http://localhost:3000",
  });
  const page = await context.newPage();

  const response = await page.request.post("/api/test/sign-in", {
    headers: { "Content-Type": "application/json" },
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Test sign-in failed: ${response.status()} ${body}`);
  }

  // 3. Save storage state with naturally-set auth cookies
  await context.storageState({ path: "e2e/auth.json" });
  await browser.close();
}
