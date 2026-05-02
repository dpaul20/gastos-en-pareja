import { test as base, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, TEST_EMAIL } from "../config";

// ── Fixture types ─────────────────────────────────────────────────────────────
export type AppFixtures = {
  /** Authenticated browser page — reads storage state from e2e/auth.json */
  authenticatedPage: Page;
  /** Supabase admin client — bypasses RLS for test setup / teardown */
  adminClient: SupabaseClient<Database>;
  /** couple_id belonging to the E2E test user */
  coupleId: string;
};

// ── Custom test ───────────────────────────────────────────────────────────────
export const test = base.extend<AppFixtures>({
  /**
   * Creates a new browser context with the saved auth storage state so every
   * test that uses this fixture starts already authenticated.
   * The context is closed automatically after the test ends.
   */
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "e2e/auth.json",
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  /**
   * Service-role Supabase client.
   * Use this in beforeEach/afterEach to create or delete test data
   * without going through the UI.  Keeps tests isolated.
   */
  adminClient: async ({}, use) => {
    const client = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await use(client);
  },

  /**
   * Resolves the couple_id for the E2E test user.
   * Fails fast if the global-setup was not run (couple doesn't exist).
   */
  coupleId: async ({ adminClient }, use) => {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
    if (!testUser) {
      throw new Error(
        `E2E test user <${TEST_EMAIL}> not found. Did you run the global setup?`,
      );
    }

    const { data: member, error } = await adminClient
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", testUser.id)
      .single();

    if (error || !member) {
      throw new Error(
        `No couple found for <${TEST_EMAIL}>. Did the global setup complete?`,
      );
    }

    await use(member.couple_id);
  },
});

export { expect } from "@playwright/test";
