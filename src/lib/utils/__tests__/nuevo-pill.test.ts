import { describe, it, expect } from "vitest";
import { shouldShowNuevoPill, NUEVO_PILL_WINDOW_MS } from "../nuevo-pill";

const HOUR = 60 * 60 * 1000;

describe("shouldShowNuevoPill", () => {
  it("shows the pill for a CONFIRMED instance billed 1 hour ago", () => {
    const now = new Date("2026-08-17T12:00:00Z");
    const billedAt = new Date(now.getTime() - 1 * HOUR).toISOString();
    expect(
      shouldShowNuevoPill({ status: "CONFIRMED", billed_at: billedAt }, now),
    ).toBe(true);
  });

  it("hides the pill once the 48h window has elapsed", () => {
    const now = new Date("2026-08-19T12:00:01Z");
    const billedAt = new Date(now.getTime() - 49 * HOUR).toISOString();
    expect(
      shouldShowNuevoPill({ status: "CONFIRMED", billed_at: billedAt }, now),
    ).toBe(false);
  });

  it("hides the pill exactly at the 48h boundary (window is exclusive)", () => {
    const now = new Date("2026-08-19T12:00:00Z");
    const billedAt = new Date(
      now.getTime() - NUEVO_PILL_WINDOW_MS,
    ).toISOString();
    expect(
      shouldShowNuevoPill({ status: "CONFIRMED", billed_at: billedAt }, now),
    ).toBe(false);
  });

  it("hides the pill when billed_at is null", () => {
    const now = new Date("2026-08-17T12:00:00Z");
    expect(
      shouldShowNuevoPill({ status: "CONFIRMED", billed_at: null }, now),
    ).toBe(false);
  });

  it("gates on status === CONFIRMED — a stale billed_at on a reverted AWAITING_BILL instance must not light the pill", () => {
    // markFixedExpenseInstanceAwaitingBill clears billed_at on revert (PR2
    // fix batch), but this predicate must not rely on that alone — a
    // belt-and-suspenders status check is required per the coordinator's
    // explicit PR3 instruction.
    const now = new Date("2026-08-17T12:00:00Z");
    const billedAt = new Date(now.getTime() - 1 * HOUR).toISOString();
    expect(
      shouldShowNuevoPill(
        { status: "AWAITING_BILL", billed_at: billedAt },
        now,
      ),
    ).toBe(false);
  });

  it("gates on status === CONFIRMED — a legacy PENDING_CONFIRMATION row with a billed_at must not light the pill", () => {
    const now = new Date("2026-08-17T12:00:00Z");
    const billedAt = new Date(now.getTime() - 1 * HOUR).toISOString();
    expect(
      shouldShowNuevoPill(
        { status: "PENDING_CONFIRMATION", billed_at: billedAt },
        now,
      ),
    ).toBe(false);
  });

  it("hides the pill when billed_at is in the future (clock skew)", () => {
    const now = new Date("2026-08-17T12:00:00Z");
    const billedAt = new Date(now.getTime() + 1 * HOUR).toISOString();
    expect(
      shouldShowNuevoPill({ status: "CONFIRMED", billed_at: billedAt }, now),
    ).toBe(false);
  });

  it("hides the pill when billed_at is an unparseable string", () => {
    const now = new Date("2026-08-17T12:00:00Z");
    expect(
      shouldShowNuevoPill(
        { status: "CONFIRMED", billed_at: "not-a-date" },
        now,
      ),
    ).toBe(false);
  });
});
