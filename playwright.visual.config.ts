import { defineConfig } from "@playwright/test";

import base from "./playwright.config";

/**
 * Visual-snapshot config — the local-only pixel oracle.
 *
 * The default config (playwright.config.ts) keeps `testIgnore: ["** /visual.spec.ts"]`
 * so `npm run test:e2e` and CI never run the visual suite (it is intentionally a
 * local tool — see commit b13329c). But Playwright applies `testIgnore` even when
 * a file is named explicitly, which made `npm run test:visual` match zero tests.
 *
 * This dedicated config clears that ignore and matches ONLY visual.spec.ts, so
 * `test:visual` can actually run it locally. The project name stays
 * "chromium-mobile" so the committed `*-chromium-mobile-*.png` baselines match.
 */
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: ["**/visual.spec.ts"],
});
