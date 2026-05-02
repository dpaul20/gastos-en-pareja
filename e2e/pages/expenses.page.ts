import type { Page, Locator } from "@playwright/test";

export type ExpenseTab = "Cuotas" | "Fijos" | "Variables";

/**
 * Page Object Model for the Expenses page (/expenses).
 *
 * Wraps the segmented control, the FAB, and the AddSheet dialog so that
 * test code reads like a user story rather than a CSS selector soup.
 */
export class ExpensesPage {
  readonly fab: Locator;

  constructor(private readonly page: Page) {
    this.fab = page.getByRole("button", { name: "Agregar gasto" });
  }

  async goto() {
    await this.page.goto("/expenses");
    // Wait for the segmented control — confirms the page is hydrated
    await this.tabButton("Cuotas").waitFor({ state: "visible" });
  }

  // ── Segmented control ──────────────────────────────────────────────────────

  tabButton(tab: ExpenseTab): Locator {
    return this.page.getByRole("button", { name: tab });
  }

  async selectTab(tab: ExpenseTab) {
    await this.tabButton(tab).click();
  }

  // ── AddSheet dialog ────────────────────────────────────────────────────────

  /** Opens the dialog for the currently active tab */
  async openAddSheet() {
    await this.fab.click();
    await this.dialog().waitFor({ state: "visible" });
  }

  dialog(): Locator {
    return this.page.getByRole("dialog", { name: "Agregar gasto" });
  }

  /** Returns a labeled input INSIDE the add-sheet dialog */
  dialogField(label: string): Locator {
    return this.dialog().getByLabel(label);
  }

  saveButton(): Locator {
    return this.dialog().getByRole("button", { name: "Guardar" });
  }

  async closeDialog() {
    // Click the backdrop (aria-hidden element) — use Escape key instead so
    // keyboard-only users can also close it.
    await this.page.keyboard.press("Escape");
  }

  // ── List items ─────────────────────────────────────────────────────────────

  /** Locates all list items containing the given text in the current view */
  itemByDescription(description: string): Locator {
    return this.page.getByText(description).first();
  }
}
