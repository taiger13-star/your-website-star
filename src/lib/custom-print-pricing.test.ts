import { describe, expect, it } from "vitest";

import { calculateCustomPrintPrice, calculateMinimumPrintEstimate } from "./custom-print-pricing";

describe("custom print estimate", () => {
  const pricing = {
    materialRubKg: 1600,
    machineRubHour: 40,
    laborRubHour: 60,
    gramsPerHour: 20,
    setupFeeRub: 200,
    wastePercent: 10,
    markupPercent: 50,
    minimumOrderRub: 500,
  };

  it("charges material and print time per item, with one setup fee per order", () => {
    expect(calculateCustomPrintPrice(pricing, 100, 1)).toBe(1400);
    expect(calculateCustomPrintPrice(pricing, 100, 2)).toBe(2400);
  });

  it("respects the minimum order and rounds up to hundreds", () => {
    expect(calculateCustomPrintPrice({ ...pricing, minimumOrderRub: 1500 }, 20, 1)).toBe(1500);
    expect(
      calculateCustomPrintPrice(
        { ...pricing, setupFeeRub: 0, markupPercent: 0, minimumOrderRub: 0 },
        25,
        1,
      ),
    ).toBe(200);
  });

  it("shows a material-only lower bound on the public page", () => {
    expect(calculateMinimumPrintEstimate(1000, 1000, 1)).toBe(1000);
    expect(calculateMinimumPrintEstimate(1000, 150, 2)).toBe(300);
  });
});
