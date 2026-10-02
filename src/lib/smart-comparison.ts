import type { PublicProduct } from "@/server/catalog-service";

export const SMART_COMPARISON_FEATURES = [
  { label: "Дизайн", standard: true, smart: true },
  { label: "Съёмная посадочная вставка", standard: false, smart: true },
  { label: "Резервуар", standard: false, smart: true },
  { label: "Верхний долив", standard: false, smart: true },
  { label: "Индикатор воды", standard: false, smart: true },
  { label: "Капиллярная система", standard: false, smart: true },
] as const;

export type SmartPriceComparison = {
  standardPrice: number | null;
  smartPrice: number | null;
};

function minimum(values: number[]) {
  return values.length ? Math.min(...values) : null;
}

function supportsBothSystems(product: PublicProduct) {
  return (
    product.variants.some((variant) => variant.system === "standard") &&
    product.variants.some((variant) => variant.system === "smart")
  );
}

export function getSmartCatalogPrices(products: PublicProduct[]): SmartPriceComparison {
  const compatible = products.filter(supportsBothSystems);
  return {
    standardPrice: minimum(
      compatible.flatMap((product) =>
        product.variants
          .filter((variant) => variant.system === "standard")
          .map((variant) => variant.price),
      ),
    ),
    smartPrice: minimum(
      compatible.flatMap((product) =>
        product.variants
          .filter((variant) => variant.system === "smart")
          .map((variant) => variant.price),
      ),
    ),
  };
}

export function getProductSmartPrices(
  product: PublicProduct,
  sizeCode: string,
): SmartPriceComparison {
  const forSize = product.variants.filter((variant) => variant.sizeCode === sizeCode);
  return {
    standardPrice: forSize.find((variant) => variant.system === "standard")?.price ?? null,
    smartPrice: forSize.find((variant) => variant.system === "smart")?.price ?? null,
  };
}
