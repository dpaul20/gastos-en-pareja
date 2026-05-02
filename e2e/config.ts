/**
 * E2E test configuration — single source of truth.
 *
 * All Supabase credentials and test-user constants live here.
 * Import from this file; never hardcode values in spec or fixture files.
 */

// NOSONAR: local-only demo credentials — never used in production
export const SUPABASE_URL =
  process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321";

// NOSONAR: well-known Supabase local dev service-role key — safe to commit
export const SUPABASE_SERVICE_KEY =
  process.env.E2E_SUPABASE_SERVICE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0MDAwMDAwMCwiZXhwIjoxOTgzODEyOTk2fQ.UTtkogysuF6fIO9e0N2rZeyhN4t33YHYny4OIa7yf08"; // NOSONAR

export const TEST_EMAIL =
  process.env.E2E_TEST_EMAIL ?? "test@gastospareja.local";
