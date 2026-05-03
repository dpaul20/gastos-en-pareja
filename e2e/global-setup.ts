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

  const { data: users, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw new Error(`Failed to list users: ${listError.message}`);

  const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
  if (!testUser)
    throw new Error(
      `Test user ${TEST_EMAIL} not found. Run the setup script first.`,
    );

  const userId = testUser.id;

  // Use maybeSingle() to avoid PGRST116 error when 0 rows exist
  const { data: existing, error: existingError } = await admin
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError)
    throw new Error(
      `Failed to check existing couple_member: ${existingError.message}`,
    );

  if (existing) {
    const { error: updateError } = await admin
      .from("couples")
      .update({ status: "ACTIVE" })
      .eq("id", existing.couple_id);

    if (updateError)
      throw new Error(`Failed to update couple status: ${updateError.message}`);
  } else {
    const { data: couple, error: coupleError } = await admin
      .from("couples")
      .insert({ status: "ACTIVE" })
      .select()
      .single();

    if (coupleError || !couple)
      throw new Error(
        `Failed to create couple: ${coupleError?.message ?? "no data returned"}`,
      );

    const { error: memberError } = await admin
      .from("couple_members")
      .insert({ couple_id: couple.id, user_id: userId, role: "OWNER" });

    if (memberError)
      throw new Error(
        `Failed to create couple_member: ${memberError.message} (code: ${memberError.code})`,
      );

    // Verify the row was actually inserted
    const { data: verify, error: verifyError } = await admin
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (verifyError || !verify)
      throw new Error(
        `couple_member not found after insert — verify error: ${verifyError?.message ?? "row missing"}`,
      );
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
