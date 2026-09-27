const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

/** Цена в рублях без копеек: 12 900 ₽ */
export function formatPrice(value: number): string {
  return rub.format(Math.round(value));
}

/** Число с разделителями: 1 240 */
export function formatNumber(value: number): string {
  return plain.format(value);
}

/** Грамм: 420 г */
export function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} кг`;
  return `${formatNumber(grams)} г`;
}

/** Часы печати: 7 ч 20 мин */
export function formatPrintTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

/** Миллиметры: Ø160 × H160 мм */
export function formatDimensions(d: { diameter: number; height: number }): string {
  return `Ø${d.diameter} × H${d.height} мм`;
}

/** Склонение: 1 товар, 2 товара, 5 товаров */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/** Номер заказа вида NA-260927-00124 */
export function generateOrderNumber(seq: number): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `NA-${y}${m}${d}-${String(seq).padStart(5, "0")}`;
}
