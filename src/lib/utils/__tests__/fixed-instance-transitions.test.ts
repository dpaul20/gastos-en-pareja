import { describe, it, expect } from "vitest";
import {
  canMarkAwaitingBill,
  resolveInitialInstanceStatus,
} from "../fixed-instance-transitions";

describe("canMarkAwaitingBill", () => {
  it("allows reverting a CONFIRMED instance (the normal 'un mes no llegó' case)", () => {
    expect(canMarkAwaitingBill("CONFIRMED")).toBe(true);
  });

  it("allows reverting a legacy PENDING_CONFIRMATION instance", () => {
    expect(canMarkAwaitingBill("PENDING_CONFIRMATION")).toBe(true);
  });

  it("BLOCKS reverting an instance that is already AWAITING_BILL (nothing to revert)", () => {
    expect(canMarkAwaitingBill("AWAITING_BILL")).toBe(false);
  });
});

describe("resolveInitialInstanceStatus", () => {
  it("awaits_bill wins: AWAITING_BILL regardless of requires_monthly_review", () => {
    expect(
      resolveInitialInstanceStatus({
        awaits_bill: true,
        requires_monthly_review: false,
      }),
    ).toBe("AWAITING_BILL");
    expect(
      resolveInitialInstanceStatus({
        awaits_bill: true,
        requires_monthly_review: true,
      }),
    ).toBe("AWAITING_BILL");
  });

  it("requires_monthly_review (legacy) yields PENDING_CONFIRMATION when not awaiting a bill", () => {
    expect(
      resolveInitialInstanceStatus({
        awaits_bill: false,
        requires_monthly_review: true,
      }),
    ).toBe("PENDING_CONFIRMATION");
  });

  it("neither flag set yields CONFIRMED", () => {
    expect(
      resolveInitialInstanceStatus({
        awaits_bill: false,
        requires_monthly_review: false,
      }),
    ).toBe("CONFIRMED");
  });

  it("treats undefined/null flags as false (DB nulls, missing fields)", () => {
    expect(resolveInitialInstanceStatus({})).toBe("CONFIRMED");
    expect(resolveInitialInstanceStatus({ awaits_bill: null })).toBe(
      "CONFIRMED",
    );
    expect(
      resolveInitialInstanceStatus({
        awaits_bill: true,
        requires_monthly_review: null,
      }),
    ).toBe("AWAITING_BILL");
  });
});
