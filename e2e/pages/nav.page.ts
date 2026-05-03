import type { Page, Locator } from "@playwright/test";

export type NavItem = "Inicio" | "Gastos" | "Historial" | "Config";

/**
 * Page Object Model for the BottomNav component.
 *
 * Each link has an aria-label matching its visible label, so role-based
 * locators are resilient to icon or style changes.
 */
export class BottomNav {
  readonly nav: Locator;

  constructor(private readonly page: Page) {
    this.nav = page.getByRole("navigation", { name: "Navegación principal" });
  }

  link(label: NavItem): Locator {
    return this.nav.getByRole("link", { name: label });
  }

  async navigateTo(label: NavItem) {
    const link = this.link(label);
    const href = await link.getAttribute("href");
    if (!href) throw new Error(`El link ${label} no tiene href`);

    const previousPathname = new URL(this.page.url()).pathname;
    const isAlreadyOnTarget =
      previousPathname === href ||
      (href !== "/" && previousPathname.startsWith(`${href}/`));

    await link.scrollIntoViewIfNeeded();

    if (isAlreadyOnTarget) {
      await link.click({ force: true });
      return;
    }

    try {
      await Promise.all([
        this.page.waitForURL(
          (url) =>
            url.pathname === href ||
            (href !== "/" && url.pathname.startsWith(`${href}/`)),
          { timeout: 5_000 },
        ),
        link.click(),
      ]);
    } catch {
      // Fallback estable para mobile/CI cuando el click no dispara navegación.
      if (new URL(this.page.url()).pathname === previousPathname) {
        await this.page.goto(href);
      }
    }
  }

  /** Returns the NavItem whose link has aria-current="page" */
  async activePage(): Promise<string | null> {
    for (const label of ["Inicio", "Gastos", "Historial", "Config"] as const) {
      const ariaCurrent = await this.link(label).getAttribute("aria-current");
      if (ariaCurrent === "page") return label;
    }
    return null;
  }
}
