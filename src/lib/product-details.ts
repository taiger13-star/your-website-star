export type VariantMeasurements = {
  outerWidthMm: number | null;
  outerDepthMm: number | null;
  outerDiameterMm: number | null;
  outerHeightMm: number | null;
  innerWidthMm: number | null;
  innerDepthMm: number | null;
  innerDiameterMm: number | null;
  innerHeightMm: number | null;
  plantingVolumeMl: number | null;
  reservoirVolumeMl: number | null;
  weightGrams: number | null;
  scaleReference: "plant" | "person" | "interior" | "none";
};

export type PublicSpecification = {
  id: string;
  variantId: string | null;
  code: string;
  label: string;
  value: string;
  unit: string | null;
  sortOrder: number;
};

export type PublicSpecificationSection = {
  id: string;
  title: string;
  sortOrder: number;
  items: PublicSpecification[];
};

export const EMPTY_MEASUREMENTS: VariantMeasurements = {
  outerWidthMm: null,
  outerDepthMm: null,
  outerDiameterMm: null,
  outerHeightMm: null,
  innerWidthMm: null,
  innerDepthMm: null,
  innerDiameterMm: null,
  innerHeightMm: null,
  plantingVolumeMl: null,
  reservoirVolumeMl: null,
  weightGrams: null,
  scaleReference: "plant",
};

export function displaySize(code: string, measurements: VariantMeasurements) {
  const height = measurements.outerHeightMm ? `H${measurements.outerHeightMm}` : null;
  const footprint = measurements.outerDiameterMm
    ? `Ø${measurements.outerDiameterMm}`
    : [measurements.outerWidthMm, measurements.outerDepthMm]
        .filter((value): value is number => value !== null)
        .join(" × ");
  const parts = [footprint, height].filter(Boolean);
  return parts.length ? `${code} — ${parts.join(" × ")} мм` : code;
}

/** Variant rows override an object-level row with the same code. */
export function resolveSpecifications(sections: PublicSpecificationSection[], variantId: string) {
  return sections
    .map((section) => {
      const selected = new Map<string, PublicSpecification>();
      for (const item of section.items) {
        if (item.variantId === null) selected.set(item.code, item);
      }
      for (const item of section.items) {
        if (item.variantId === variantId) selected.set(item.code, item);
      }
      return {
        ...section,
        items: [...selected.values()].sort((a, b) => a.sortOrder - b.sortOrder),
      };
    })
    .filter((section) => section.items.length > 0);
}

export function formatSpecification(item: Pick<PublicSpecification, "value" | "unit">) {
  return [item.value, item.unit].filter(Boolean).join(" ");
}
