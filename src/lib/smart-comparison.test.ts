import { describe, expect, it } from "vitest";

import type { PublicProduct } from "@/server/catalog-service";

import { getProductSmartPrices, getSmartCatalogPrices } from "./smart-comparison";

function product(variants: { sizeCode: string; system: "standard" | "smart"; price: number }[]) {
  return { variants } as PublicProduct;
}

describe("SMART price comparison", () => {
  it("uses only products that offer both executions for catalog prices", () => {
    const prices = getSmartCatalogPrices([
      product([
        { sizeCode: "S", system: "standard", price: 4900 },
        { sizeCode: "S", system: "smart", price: 6900 },
      ]),
      product([{ sizeCode: "S", system: "standard", price: 3900 }]),
      product([
        { sizeCode: "M", system: "standard", price: 6400 },
        { sizeCode: "M", system: "smart", price: 9000 },
      ]),
    ]);

    expect(prices).toEqual({ standardPrice: 4900, smartPrice: 6900 });
  });

  it("finds prices for the selected size only", () => {
    const item = product([
      { sizeCode: "S", system: "standard", price: 4900 },
      { sizeCode: "S", system: "smart", price: 6900 },
      { sizeCode: "M", system: "standard", price: 6400 },
    ]);

    expect(getProductSmartPrices(item, "S")).toEqual({ standardPrice: 4900, smartPrice: 6900 });
    expect(getProductSmartPrices(item, "M")).toEqual({ standardPrice: 6400, smartPrice: null });
  });
});
