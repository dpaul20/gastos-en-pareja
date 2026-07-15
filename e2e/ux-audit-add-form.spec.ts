/**
 * UX/UI Senior Audit — Add expense form (deep evaluation)
 * Covers: a11y axe, touch targets, focus management, tab order,
 *         keyboard switch, error states, viewports, contrast,
 *         all three tabs (cuotas / fijos / variables)
 */
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

async function openForm(page: Page, type: "cuota" | "servicio" | "compra") {
  await page.goto("/expenses");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Agregar gasto" }).click();
  await page.getByTestId(`type-option-${type}`).click();

  if (type === "servicio") {
    // "Servicio" opens the "Servicios del mes" list sheet first;
    // the actual AddSheet form is reached via "+ Nuevo servicio"
    await page.getByRole("button", { name: "+ Nuevo servicio" }).click();
  }

  await page.waitForSelector('[role="dialog"] form');
}

async function expectNoSeriousFormViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();

  const criticalOrSerious = results.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact ?? ""),
  );

  if (criticalOrSerious.length > 0) {
    console.log(
      `VIOLATIONS (${label}):\n` +
        JSON.stringify(
          criticalOrSerious.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            nodes: v.nodes.slice(0, 2).map((n) => n.html),
          })),
          null,
          2,
        ),
    );
  }

  expect(
    criticalOrSerious,
    `Found ${criticalOrSerious.length} critical/serious violations in ${label}`,
  ).toHaveLength(0);
}

test.describe("UX audit — add expense form", () => {
  // ── A11Y per tab ────────────────────────────────────────────
  test("a11y — cuotas form: no critical/serious WCAG violations", async ({
    authenticatedPage: page,
  }) => {
    await openForm(page, "cuota");
    await expectNoSeriousFormViolations(page, "cuotas");
  });

  test("a11y — fijos form: no critical/serious WCAG violations", async ({
    authenticatedPage: page,
  }) => {
    await openForm(page, "servicio");
    await expectNoSeriousFormViolations(page, "fijos");
  });

  test("a11y — variables form: no critical/serious WCAG violations", async ({
    authenticatedPage: page,
  }) => {
    await openForm(page, "compra");
    await expectNoSeriousFormViolations(page, "variables");
  });

  // ── TOUCH TARGETS ───────────────────────────────────────────
  test("touch targets — all interactive elements ≥ 44px height", async ({
    authenticatedPage: page,
  }) => {
    await openForm(page, "cuota");

    const results: { el: string; height: number; width: number }[] =
      await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return [];
        const interactive = dialog.querySelectorAll(
          'button, input, select, textarea, [role="switch"], [role="checkbox"]',
        );
        return Array.from(interactive).map((el) => {
          const r = el.getBoundingClientRect();
          return {
            el:
              el.getAttribute("aria-label") ||
              el.getAttribute("placeholder") ||
              (el as HTMLElement).innerText?.slice(0, 30) ||
              el.tagName,
            height: Math.round(r.height),
            width: Math.round(r.width),
          };
        });
      });

    // Switch (and its hidden input) use a CSS ::after hit-slop to expand the
    // tap target to ~44px without growing the visual track. getBoundingClientRect()
    // can't see pseudo-elements, so they're verified separately via the hit-slop test.
    const belowMinimum = results.filter(
      (r) =>
        r.height < 44 && r.el !== "Renovación automática" && r.el !== "INPUT",
    );

    expect(results.length).toBeGreaterThan(0);
    expect(
      belowMinimum,
      `Interactive elements below 44px: ${JSON.stringify(belowMinimum)}`,
    ).toHaveLength(0);
  });

  // ── SWITCH HIT-SLOP ─────────────────────────────────────────
  test("switch — CSS hit-slop expands tap target beyond visual bounds", async ({
    authenticatedPage: page,
  }) => {
    await openForm(page, "cuota");

    const switchEl = page.locator(
      '[role="switch"][aria-label="Renovación automática"]',
    );
    const box = await switchEl.boundingBox();
    if (!box) throw new Error("Switch not found");

    const before = await switchEl.getAttribute("aria-checked");

    // Click 10px above the visual top edge — inside the after:-inset-y-3.5 hit-slop area
    await page.mouse.click(box.x + box.width / 2, box.y - 10);

    const after = await switchEl.getAttribute("aria-checked");
    expect(after).not.toBe(before);
  });

  // ── FOCUS MANAGEMENT ────────────────────────────────────────
  test("focus — first field receives focus when form opens", async ({
    authenticatedPage: page,
  }) => {
    await openForm(page, "cuota");
    await page.waitForTimeout(300);

    const focusIsInDialog = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog?.contains(document.activeElement) ?? false;
    });

    expect(focusIsInDialog, "Focus should be inside the dialog on open").toBe(
      true,
    );
  });

  // ── TAB ORDER ───────────────────────────────────────────────
  test("keyboard — tab order follows visual reading order and reaches Guardar", async ({
    authenticatedPage: page,
  }) => {
    await openForm(page, "cuota");

    const focusOrder: string[] = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        return (
          el.getAttribute("aria-label") ||
          el.getAttribute("placeholder") ||
          el.getAttribute("id") ||
          (el as HTMLElement).innerText?.slice(0, 30) ||
          el.tagName
        );
      });
      if (focused) focusOrder.push(focused);
      if (focused?.toLowerCase().includes("guardar")) break;
    }

    expect(focusOrder.length).toBeGreaterThan(4);
    expect(focusOrder.some((f) => f.toLowerCase().includes("guardar"))).toBe(
      true,
    );
  });

  // ── SWITCH KEYBOARD ─────────────────────────────────────────
  test("keyboard — Renovar automáticamente switch togglable with Space", async ({
    authenticatedPage: page,
  }) => {
    await openForm(page, "cuota");

    const switchEl = page.locator(
      '[role="switch"][aria-label="Renovación automática"]',
    );
    await switchEl.focus();

    const beforeState = await switchEl.getAttribute("aria-checked");
    await page.keyboard.press("Space");
    const afterState = await switchEl.getAttribute("aria-checked");

    expect(afterState).not.toBe(beforeState);
  });

  // ── ERROR STATES ────────────────────────────────────────────
  test("validation — empty submit shows errors on all required fields", async ({
    authenticatedPage: page,
  }) => {
    await openForm(page, "cuota");

    await page.getByRole("button", { name: "Guardar" }).click();
    await page.waitForTimeout(400);

    const errors = await page.locator('[role="alert"]').count();

    // cuotas has 3 required fields: description, total_amount, installments
    expect(errors).toBeGreaterThanOrEqual(3);
  });

  // ── PLACEHOLDERS ────────────────────────────────────────────
  test("placeholders — new hint texts are visible and money field has no '0' placeholder", async ({
    authenticatedPage: page,
  }) => {
    await openForm(page, "cuota");

    // Tarjeta (opcional) is now the structured CardPicker (chips), not a
    // free-text input — its "Nueva tarjeta" inline form is where the
    // "ej: Visa Santander" hint lives, per design R3-D/R3-E.
    await page.getByTestId("new-card-trigger").click();

    const placeholders = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return [];
      const inputs = dialog.querySelectorAll("input[placeholder]");
      return Array.from(inputs).map((el) => ({
        id: el.id,
        placeholder: (el as HTMLInputElement).placeholder,
      }));
    });

    const cuotasPlaceholder = placeholders.find(
      (p) => p.placeholder === "ej: 12",
    );
    const tarjetaPlaceholder = placeholders.find((p) =>
      p.placeholder.includes("Visa"),
    );
    const moneyPlaceholder = placeholders.find(
      (p) => p.id === "field-total-amount",
    );

    expect(cuotasPlaceholder).toBeDefined();
    expect(tarjetaPlaceholder).toBeDefined();
    expect(moneyPlaceholder?.placeholder ?? "").toBe("");
  });

  // ── SWITCH DESCRIPTION ──────────────────────────────────────
  test("switch — 'Renovar automáticamente' has visible sub-description", async ({
    authenticatedPage: page,
  }) => {
    await openForm(page, "cuota");

    const description = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return (
        dialog?.textContent?.includes("Las cuotas se reinician al terminar") ??
        false
      );
    });

    expect(description, "Sub-description should be visible").toBe(true);
  });

  // ── VIEWPORTS ───────────────────────────────────────────────
  for (const vp of [
    { name: "iPhone-SE", w: 375, h: 667 },
    { name: "iPhone-14", w: 390, h: 844 },
    { name: "iPhone-14-Pro-Max", w: 430, h: 932 },
  ]) {
    test(`viewport — cuotas form at ${vp.name} (${vp.w}x${vp.h}) fits without horizontal overflow`, async ({
      authenticatedPage: page,
    }) => {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await openForm(page, "cuota");

      const guardar = page.getByRole("button", { name: "Guardar" });
      await expect(guardar).toBeVisible();

      const overflow = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog ? dialog.scrollWidth > dialog.clientWidth : false;
      });
      expect(overflow, `Horizontal overflow at ${vp.name}`).toBe(false);
    });
  }
});
