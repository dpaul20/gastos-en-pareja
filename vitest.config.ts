import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/e2e/**", "**/qacito_tests/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: [
        // Components need DOM (jsdom) — covered by Playwright e2e
        "src/components/**",
        // Query hooks need React context + Supabase — covered by Playwright e2e
        "src/lib/queries/**",
        // Server Actions with Supabase calls — covered by Playwright e2e
        "src/lib/actions/couple.ts",
        // Supabase client factories and React providers — infrastructure
        "src/lib/supabase/**",
        "src/lib/providers.tsx",
        // Next.js pages, layouts, route handlers — covered by Playwright e2e
        "src/app/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
