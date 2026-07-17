import { describe, it, expect } from "vitest";
import { isValidBillAmount, MAX_BILL_AMOUNT } from "../bill-amount";

describe("isValidBillAmount", () => {
  it("accepts a realistic bill amount (Epec $72.375)", () => {
    expect(isValidBillAmount(72_375)).toBe(true);
  });

  it("rejects zero", () => {
    expect(isValidBillAmount(0)).toBe(false);
  });

  it("rejects negative amounts", () => {
    expect(isValidBillAmount(-100)).toBe(false);
  });

  it("rejects non-finite values", () => {
    expect(isValidBillAmount(Infinity)).toBe(false);
    expect(isValidBillAmount(NaN)).toBe(false);
  });

  it("accepts the exact ceiling", () => {
    expect(isValidBillAmount(MAX_BILL_AMOUNT)).toBe(true);
  });

  it("rejects one peso above the ceiling — guards balance.ts's splitting math against a fat-fingered extra digit", () => {
    expect(isValidBillAmount(MAX_BILL_AMOUNT + 1)).toBe(false);
  });
});
