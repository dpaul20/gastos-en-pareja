import { test as base, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, TEST_EMAIL } from "../config";

// ── Fixture types ─────────────────────────────────────────────────────────────

/** Test-scoped fixtures (one instance per test) */
type TestFixtures = {
  /** Authenticated browser page — reads storage state from e2e/auth.json */
  authenticatedPage: Page;
};

/** Worker-scoped fixtures (one instance per worker, shared across tests) */
type WorkerFixtures = {
  /** Supabase admin client — bypasses RLS for test setup / teardown */
  adminClient: SupabaseClient<Database>;
  /** couple_id belonging to the E2E test user (cached per worker) */
  coupleId: string;
  /** user_id of the E2E test user (cached per worker) */
  testUserId: string;
};

export type AppFixtures = TestFixtures & WorkerFixtures;

// ── Custom test ───────────────────────────────────────────────────────────────
export const test = base.extend<TestFixtures, WorkerFixtures>({
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
   * Service-role Supabase client — worker-scoped so it is created once per
   * worker process and shared across all tests in that worker.
   * Safe because the client is stateless (service role key, no session).
   */
  adminClient: [
    async ({}, use) => {
      const client = createClient<Database>(
        SUPABASE_URL,
        SUPABASE_SERVICE_KEY,
        {
          auth: { autoRefreshToken: false, persistSession: false },
        },
      );
      await use(client);
    },
    { scope: "worker" },
  ],

  /**
   * user_id of the E2E test user — worker-scoped so listUsers() is called
   * exactly once per worker for the entire test run.
   */
  testUserId: [
    async ({ adminClient }, use) => {
      const { data: users } = await adminClient.auth.admin.listUsers();
      const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
      if (!testUser) {
        throw new Error(
          `E2E test user <${TEST_EMAIL}> not found. Did you run the global setup?`,
        );
      }
      await use(testUser.id);
    },
    { scope: "worker" },
  ],

  /**
   * couple_id for the E2E test user — worker-scoped, derived from testUserId
   * so the expensive listUsers() call is shared.
   */
  coupleId: [
    async ({ adminClient, testUserId }, use) => {
      const { data: member, error } = await adminClient
        .from("couple_members")
        .select("couple_id")
        .eq("user_id", testUserId)
        .single();

      if (error || !member) {
        throw new Error(
          `No couple found for <${TEST_EMAIL}>. Did the global setup complete?`,
        );
      }

      await use(member.couple_id);
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";
