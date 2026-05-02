import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

function getRequiredPublicEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function createClient() {
  const supabaseUrl = getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
