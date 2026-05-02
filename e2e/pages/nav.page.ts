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
    // force:true bypasses the <nextjs-portal> dev overlay that intercepts pointer events
    await this.link(label).click({ force: true });
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
