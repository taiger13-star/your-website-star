import type { ColorId } from "@/lib/types";

export const CUSTOMER_MATERIALS = [
  { id: "PLA", label: "PLA", description: "Матовая интерьерная поверхность." },
  {
    id: "PETG",
    label: "PETG",
    description: "Влагостойкий материал для кашпо и функциональных изделий.",
  },
  { id: "TPU", label: "TPU", description: "Эластичный материал для мягких и защитных элементов." },
] as const;

export type CustomerMaterialId = (typeof CUSTOMER_MATERIALS)[number]["id"];

export const PRICE_COLOR_IDS: ColorId[] = [
  "ivory",
  "sand",
  "stone",
  "graphite",
  "black",
  "sage",
  "terracotta",
];

export type QuoteRequest = {
  productId: string;
  size: "S" | "M" | "L" | "XL";
  system: "standard" | "smart";
  material: CustomerMaterialId;
  color: ColorId;
};

export type QuoteResult = {
  price: number;
  currency: "RUB";
};
