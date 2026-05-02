import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Login page (/login).
 *
 * Encapsulates all selectors and interactions so tests never contain
 * raw locator strings.
 */
export class LoginPage {
  readonly heading: Locator;
  readonly googleButton: Locator;
  readonly featureList: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", {
      name: "Gastos en Pareja",
      level: 1,
    });
    this.googleButton = page.getByRole("button", {
      name: "Continuar con Google",
    });
    this.featureList = page.getByRole("list");
  }

  async goto() {
    await this.page.goto("/login");
    await this.heading.waitFor({ state: "visible" });
  }

  /** Returns the text of every feature pill */
  async featurePillTexts(): Promise<string[]> {
    const items = this.featureList.getByRole("listitem");
    const count = await items.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      texts.push((await items.nth(i).textContent()) ?? "");
    }
    return texts;
  }

  /** True if the current URL matches /login */
  async isAt() {
    return /\/login/.test(this.page.url());
  }
}
