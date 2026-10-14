import { createServerOnlyFn } from "@tanstack/react-start";
import type { ColorId } from "@/lib/types";
import type { CustomerMaterialId } from "@/lib/pricing";

type MaterialPriceRow = Partial<Record<ColorId, number>> & { default?: number };
type MaterialPriceMatrix = Partial<Record<CustomerMaterialId, MaterialPriceRow>>;

type PricingConfig = {
  matrix: MaterialPriceMatrix;
  referenceMaterialCostRubKg: number;
  materialDeltaMultiplier: number;
  minimumPriceRub: number;
};

function positiveNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function parseMatrix(raw: string | undefined): MaterialPriceMatrix {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: MaterialPriceMatrix = {};
    for (const material of ["PLA", "PETG", "TPU"] as const) {
      const source = (parsed as Record<string, unknown>)[material];
      if (!source || typeof source !== "object" || Array.isArray(source)) continue;
      const row: MaterialPriceRow = {};
      for (const key of [
        "default",
        "ivory",
        "sand",
        "stone",
        "graphite",
        "black",
        "sage",
        "terracotta",
      ] as const) {
        const price = Number((source as Record<string, unknown>)[key]);
        if (Number.isFinite(price) && price > 0) row[key] = price;
      }
      result[material] = row;
    }
    return result;
  } catch {
    console.error("NOIR_MATERIAL_PRICES_JSON contains invalid JSON");
    return {};
  }
}

export const getPrivatePricingConfig = createServerOnlyFn((): PricingConfig => ({
  matrix: parseMatrix(process.env.NOIR_MATERIAL_PRICES_JSON),
  referenceMaterialCostRubKg: positiveNumber(process.env.NOIR_REFERENCE_MATERIAL_COST_RUB_KG, 0),
  materialDeltaMultiplier: positiveNumber(process.env.NOIR_MATERIAL_DELTA_MULTIPLIER, 2.5),
  minimumPriceRub: positiveNumber(process.env.NOIR_MINIMUM_PRODUCT_PRICE_RUB, 0),
}));

export function getPrivateMaterialPrice(
  matrix: MaterialPriceMatrix,
  material: CustomerMaterialId,
  color: ColorId,
): number | null {
  const row = matrix[material];
  if (!row) return null;
  const value = row[color] ?? row.default;
  return typeof value === "number" && value > 0 ? value : null;
}
