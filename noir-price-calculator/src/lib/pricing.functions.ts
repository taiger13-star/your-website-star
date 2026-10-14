import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getProductById, priceFor, productionFor } from "@/lib/catalog";
import type { QuoteResult } from "@/lib/pricing";
import { getPrivateMaterialPrice, getPrivatePricingConfig } from "@/lib/pricing.server";

const quoteSchema = z.object({
  productId: z.string().min(1).max(120),
  size: z.enum(["S", "M", "L", "XL"]),
  system: z.enum(["standard", "smart"]),
  material: z.enum(["PLA", "PETG", "TPU"]),
  color: z.enum(["ivory", "sand", "stone", "graphite", "black", "sage", "terracotta"]),
});

function roundTo100(value: number): number {
  return Math.max(0, Math.round(value / 100) * 100);
}

export const calculateProductQuote = createServerFn({ method: "POST" })
  .validator(quoteSchema)
  .handler(async ({ data }): Promise<QuoteResult> => {
    const product = getProductById(data.productId);
    if (!product || !product.commercialApproved) throw new Error("Товар не найден");
    if (!product.sizes.includes(data.size)) throw new Error("Размер недоступен");
    if (data.system === "smart" && !product.smartAvailable) throw new Error("SMART недоступен");

    const baseRetailPrice = priceFor(product, data.size, data.system);
    const production = productionFor(product, data.size, data.system);
    const config = getPrivatePricingConfig();
    const selectedCost = getPrivateMaterialPrice(config.matrix, data.material, data.color);

    if (selectedCost === null || config.referenceMaterialCostRubKg <= 0) {
      return { price: baseRetailPrice, currency: "RUB" };
    }

    const kilograms = production.filamentGrams / 1000;
    const delta = kilograms * (selectedCost - config.referenceMaterialCostRubKg);
    const calculated = baseRetailPrice + delta * config.materialDeltaMultiplier;

    return {
      price: roundTo100(Math.max(config.minimumPriceRub, calculated)),
      currency: "RUB",
    };
  });
