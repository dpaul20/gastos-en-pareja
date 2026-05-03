import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .exclude("nextjs-portal")
    .analyze();

  const seriousOrCritical = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );

  expect(
    seriousOrCritical,
    seriousOrCritical.map((v) => `${v.id} (${v.impact}): ${v.help}`).join("\n"),
  ).toEqual([]);
}

test.describe("A11y — páginas públicas", () => {
  test("/login no tiene violaciones serias o críticas", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://localhost:3000",
    });
    const page = await context.newPage();

    await page.goto("/login");
    await page.waitForLoadState("networkidle", { timeout: 12_000 });

    await expectNoSeriousViolations(page);
    await context.close();
  });
});

test.describe("A11y — páginas autenticadas", () => {
  for (const route of ["/dashboard", "/expenses", "/history", "/settings"]) {
    test(`${route} no tiene violaciones serias o críticas`, async ({
      authenticatedPage: page,
    }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle", { timeout: 12_000 });
      await expectNoSeriousViolations(page);
    });
  }
});
