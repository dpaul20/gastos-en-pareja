import type { Page, Locator } from "@playwright/test";

export type NavItem = "Inicio" | "Gastos" | "Historial" | "Configuración";

/**
 * Page Object Model for the Sidebar navigation.
 *
 * On mobile the sidebar is a Sheet — must be opened via SidebarTrigger first.
 * On desktop it is always visible.
 */
export class BottomNav {
  readonly trigger: Locator;

  constructor(private readonly page: Page) {
    this.trigger = page.getByRole("button", { name: "Toggle Sidebar" });
  }

  /** Opens the sidebar sheet on mobile (no-op on desktop where it's always visible). */
  async openIfMobile() {
    const isTriggerVisible = await this.trigger.isVisible();
    if (isTriggerVisible) {
      await this.trigger.click();
      // Wait for sidebar links to appear
      await this.link("Inicio").waitFor({ state: "visible", timeout: 5_000 });
    }
  }

  /** Find a nav link by its visible label — works after openIfMobile() on mobile. */
  link(label: NavItem): Locator {
    return this.page.getByRole("link", { name: label, exact: true });
  }

  async navigateTo(label: NavItem) {
    await this.openIfMobile();

    const link = this.link(label);
    const href = await link.getAttribute("href");
    if (!href) throw new Error(`El link ${label} no tiene href`);

    const previousPathname = new URL(this.page.url()).pathname;
    const isAlreadyOnTarget =
      previousPathname === href ||
      (href !== "/" && previousPathname.startsWith(`${href}/`));

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
          { timeout: 8_000 },
        ),
        link.click(),
      ]);
    } catch {
      if (new URL(this.page.url()).pathname === previousPathname) {
        await this.page.goto(href);
      }
    }
  }

  async activePage(): Promise<string | null> {
    await this.openIfMobile();
    for (const label of [
      "Inicio",
      "Gastos",
      "Historial",
      "Configuración",
    ] as const) {
      const ariaCurrent = await this.link(label).getAttribute("aria-current");
      if (ariaCurrent === "page") return label;
    }
    return null;
  }
}
