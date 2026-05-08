import type { Page, Locator } from "@playwright/test";

export type ExpenseTab = "Cuotas" | "Servicios" | "Compras";

/** Maps the visible tab label to its data-testid attribute. */
const TAB_TESTID: Record<ExpenseTab, string> = {
  Cuotas: "tab-cuotas",
  Servicios: "tab-servicios",
  Compras: "tab-compras",
};

/**
 * Page Object Model for the Expenses page (/expenses).
 *
 * Wraps the segmented control, the FAB, TypeSelectorSheet, and the AddSheet
 * dialog so that test code reads like a user story.
 */
export class ExpensesPage {
  readonly fab: Locator;
  private _activeTab: ExpenseTab = "Cuotas";

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
    return this.page.getByTestId(TAB_TESTID[tab]);
  }

  async selectTab(tab: ExpenseTab) {
    await this.tabButton(tab).click();
    this._activeTab = tab;
  }

  // ── TypeSelectorSheet ──────────────────────────────────────────────────────

  typeSelectorSheet(): Locator {
    return this.page.getByTestId("type-selector-sheet");
  }

  serviceListSheet(): Locator {
    return this.page.getByTestId("service-list-sheet");
  }

  // ── AddSheet dialog ────────────────────────────────────────────────────────

  /**
   * Opens the add form navigating through the TypeSelectorSheet.
   * Uses the currently active tab to determine which type to select.
   * Servicios flow: TypeSelector → Servicio → ServiceList → Nuevo servicio → AddSheet.
   */
  async openAddSheet() {
    await this.fab.click();
    const typeSelector = this.typeSelectorSheet();
    await typeSelector.waitFor({ state: "visible" });

    if (this._activeTab === "Compras") {
      await this.page.getByTestId("type-option-compra").click();
    } else if (this._activeTab === "Cuotas") {
      await this.page.getByTestId("type-option-cuota").click();
    } else {
      // Servicios — needs extra step through ServiceListSheet
      await this.page.getByTestId("type-option-servicio").click();
      await this.serviceListSheet().waitFor({ state: "visible" });
      await this.page.getByText("+ Nuevo servicio").click();
    }

    await this.dialog().waitFor({ state: "visible" });
  }

  dialog(): Locator {
    return this.page.getByTestId("add-sheet-dialog");
  }

  /** Returns a labeled input INSIDE the add-sheet dialog */
  dialogField(label: string): Locator {
    return this.dialog().getByLabel(label);
  }

  saveButton(): Locator {
    return this.dialog().getByRole("button", { name: "Guardar" });
  }

  async closeDialog() {
    await this.page.keyboard.press("Escape");
  }

  // ── List items ─────────────────────────────────────────────────────────────

  /** Locates all list items containing the given text in the current view */
  itemByDescription(description: string): Locator {
    return this.page.getByText(description).first();
  }
}
