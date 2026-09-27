/**
 * Shared unions for the shop.
 * Kept separate from catalog.ts so stores can type their data without
 * importing product data (which pulls in image assets).
 */

export type SizeCode = "S" | "M" | "L" | "XL";

export type ShopSystem = "standard" | "smart";

export type ColorId =
  | "ivory"
  | "sand"
  | "stone"
  | "graphite"
  | "black"
  | "sage"
  | "terracotta";

export type CategoryId = "planters" | "vases" | "decor" | "smart";
