export type PrintPricing = {
  materialRubKg: number;
  machineRubHour: number;
  laborRubHour: number;
  gramsPerHour: number;
  setupFeeRub: number;
  wastePercent: number;
  markupPercent: number;
  minimumOrderRub: number;
};

/** A planning estimate based on the customer's approximate filament consumption. */
export function calculateCustomPrintPrice(
  pricing: PrintPricing,
  gramsPerItem: number,
  quantity: number,
) {
  const material = (gramsPerItem / 1000) * pricing.materialRubKg * (1 + pricing.wastePercent / 100);
  const hours = gramsPerItem / pricing.gramsPerHour;
  const unitCost = material + hours * (pricing.machineRubHour + pricing.laborRubHour);
  const total = (unitCost * quantity + pricing.setupFeeRub) * (1 + pricing.markupPercent / 100);
  return Math.ceil(Math.max(pricing.minimumOrderRub, total) / 100) * 100;
}

/** A public lower bound based only on the chosen material and estimated weight. */
export function calculateMinimumPrintEstimate(
  materialRubKg: number,
  gramsPerItem: number,
  quantity: number,
) {
  return Math.ceil(((gramsPerItem / 1000) * materialRubKg * quantity) / 100) * 100;
}
