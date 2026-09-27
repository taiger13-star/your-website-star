/**
 * NOIR ATELIER — каталог.
 *
 * Данные товара включают и витринные, и производственные поля.
 * Происхождение модели (origin / makerworld*) обязательно:
 * в публичный каталог попадают только товары с commercialApproved = true.
 */

import essential01 from "@/assets/products/essential-01.jpg";
import essential02 from "@/assets/products/essential-02.jpg";
import essential03 from "@/assets/products/essential-03.jpg";
import essential04 from "@/assets/products/essential-04.jpg";
import flow01 from "@/assets/products/flow-01.jpg";
import flow02 from "@/assets/products/flow-02.jpg";
import flow03 from "@/assets/products/flow-03.jpg";
import flow04 from "@/assets/products/flow-04.jpg";
import soft01 from "@/assets/products/soft-01.jpg";
import soft02 from "@/assets/products/soft-02.jpg";
import soft03 from "@/assets/products/soft-03.jpg";
import soft04 from "@/assets/products/soft-04.jpg";
import arch01 from "@/assets/products/arch-01.jpg";
import arch02 from "@/assets/products/arch-02.jpg";
import arch03 from "@/assets/products/arch-03.jpg";
import arch04 from "@/assets/products/arch-04.jpg";
import smart01 from "@/assets/products/smart-01.jpg";
import smart02 from "@/assets/products/smart-02.jpg";
import smart03 from "@/assets/products/smart-03.jpg";
import limited01 from "@/assets/products/limited-01.jpg";
import limited02 from "@/assets/products/limited-02.jpg";
import interiorShot from "@/assets/details/interior.jpg";
import textureShot from "@/assets/details/texture.jpg";

import type { ShopSystem, SizeCode } from "@/store/cart";

export type CategoryId = "planters" | "vases" | "decor" | "smart";
export type CollectionId =
  | "essential"
  | "flow"
  | "soft"
  | "architecture"
  | "smart"
  | "limited";
export type ColorId =
  | "ivory"
  | "sand"
  | "stone"
  | "graphite"
  | "black"
  | "sage"
  | "terracotta";
export type Origin = "noir-original" | "third-party";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "planters", label: "Кашпо" },
  { id: "vases", label: "Вазы" },
  { id: "decor", label: "Декор" },
  { id: "smart", label: "NOIR Smart" },
];

export const COLLECTIONS: {
  id: CollectionId;
  name: string;
  title: string;
  tagline: string;
  description: string;
  cover: string;
}[] = [
  {
    id: "essential",
    name: "NOIR ESSENTIAL",
    title: "Essential",
    tagline: "Чистая геометрия",
    description:
      "Базовый язык NOIR ATELIER: ровные рёбра, спокойные пропорции, матовая поверхность. Модели, с которых начинают знакомство с брендом.",
    cover: essential01,
  },
  {
    id: "flow",
    name: "NOIR FLOW",
    title: "Flow",
    tagline: "Плавная геометрия",
    description:
      "Волна, спираль, течение. Формы, которые читаются одним движением взгляда и мягко меняют восприятие интерьера.",
    cover: flow01,
  },
  {
    id: "soft",
    name: "NOIR SOFT",
    title: "Soft",
    tagline: "Мягкие формы",
    description:
      "Надутые объёмы и складки, похожие на ткань и глину. Тактильная коллекция для домов, где важны теплота и покой.",
    cover: soft01,
  },
  {
    id: "architecture",
    name: "NOIR ARCHITECTURE",
    title: "Architecture",
    tagline: "Архитектурные объекты",
    description:
      "Ступени, грани, арки. Изделия, которые работают как маленькие архитектурные акценты — в холлах, переговорных, гостиных.",
    cover: arch01,
  },
  {
    id: "smart",
    name: "NOIR SMART",
    title: "Smart",
    tagline: "Кашпо с системой автополива",
    description:
      "Та же дизайнерская форма, но с резервуаром воды, капиллярной подачей и контролем уровня. Растение получает влагу само.",
    cover: smart01,
  },
  {
    id: "limited",
    name: "LIMITED",
    title: "Limited",
    tagline: "Лимитированные серии",
    description:
      "Малые серии и экспериментальные конструкции. Каждая партия ограничена, часть моделей существует только в одном исполнении.",
    cover: limited01,
  },
];

export const SIZES: {
  code: SizeCode;
  label: string;
  diameter: number;
  height: number;
  multiplier: number;
  filamentGrams: number;
  printMinutes: number;
}[] = [
  {
    code: "S",
    label: "S",
    diameter: 120,
    height: 120,
    multiplier: 1,
    filamentGrams: 180,
    printMinutes: 240,
  },
  {
    code: "M",
    label: "M",
    diameter: 160,
    height: 160,
    multiplier: 1.3,
    filamentGrams: 320,
    printMinutes: 420,
  },
  {
    code: "L",
    label: "L",
    diameter: 200,
    height: 200,
    multiplier: 1.65,
    filamentGrams: 520,
    printMinutes: 660,
  },
  {
    code: "XL",
    label: "XL",
    diameter: 240,
    height: 240,
    multiplier: 2.05,
    filamentGrams: 780,
    printMinutes: 900,
  },
];

export const SIZE_MAP = Object.fromEntries(SIZES.map((s) => [s.code, s])) as Record<
  SizeCode,
  (typeof SIZES)[number]
>;

export const BODY_COLORS: {
  id: ColorId;
  label: string;
  swatchClass: string;
  ringClass: string;
  mix: string;
}[] = [
  { id: "ivory", label: "Ivory", swatchClass: "bg-sw-ivory", ringClass: "ring-sw-ivory", mix: "#F1ECE2" },
  { id: "sand", label: "Sand", swatchClass: "bg-sw-sand", ringClass: "ring-sw-sand", mix: "#D8CDBB" },
  { id: "stone", label: "Stone", swatchClass: "bg-sw-stone", ringClass: "ring-sw-stone", mix: "#A8A199" },
  { id: "graphite", label: "Graphite", swatchClass: "bg-sw-graphite", ringClass: "ring-sw-graphite", mix: "#5B5853" },
  { id: "black", label: "Black", swatchClass: "bg-sw-black", ringClass: "ring-sw-black", mix: "#0B0B0A" },
  { id: "sage", label: "Sage", swatchClass: "bg-sw-sage", ringClass: "ring-sw-sage", mix: "#727D61" },
  { id: "terracotta", label: "Terracotta", swatchClass: "bg-sw-terracotta", ringClass: "ring-sw-terracotta", mix: "#B26B4A" },
];

export const COLOR_MAP = Object.fromEntries(BODY_COLORS.map((c) => [c.id, c])) as Record<
  ColorId,
  (typeof BODY_COLORS)[number]
>;

/** Надбавка за систему NOIR Smart к базовой цене, ₽ */
export const SMART_UPGRADE = 2000;

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  collection: CollectionId;
  category: CategoryId;
  form: string;
  shortDescription: string;
  description: string;
  images: string[];
  sizes: SizeCode[];
  colors: ColorId[];
  smartAvailable: boolean;
  priceStandard: number;
  priceSmart: number | null;
  material: string;
  printTime: number;
  weight: number;
  featured: boolean;
  isNew: boolean;
  bestseller: boolean;
  releasedAt: string;
  origin: Origin;
  commercialApproved: boolean;
  makerworldSource: string;
  makerworldCreator: string;
  makerworldLicense: string;
  makerworldURL: string;
  productionFileId: string;
};

type Seed = {
  id: string;
  name: string;
  collection: CollectionId;
  category: CategoryId;
  form: string;
  short: string;
  description: string;
  primary: string;
  standard: number;
  smart?: number;
  sizes?: SizeCode[];
  colors?: ColorId[];
  material?: string;
  featured?: boolean;
  isNew?: boolean;
  bestseller?: boolean;
  releasedAt: string;
};

function make(seed: Seed): Product {
  const smartAvailable = seed.smart !== undefined;
  return {
    id: seed.id,
    slug: seed.id,
    sku: `NA-${seed.id.replace("noir-", "").toUpperCase()}`,
    name: seed.name,
    collection: seed.collection,
    category: seed.category,
    form: seed.form,
    shortDescription: seed.short,
    description: seed.description,
    images: [seed.primary, interiorShot, textureShot],
    sizes: seed.sizes ?? ["S", "M", "L", "XL"],
    colors: seed.colors ?? BODY_COLORS.map((c) => c.id),
    smartAvailable,
    priceStandard: seed.standard,
    priceSmart: seed.smart ?? null,
    material: seed.material ?? "PLA",
    printTime: SIZE_MAP.S.printMinutes,
    weight: SIZE_MAP.S.filamentGrams,
    featured: seed.featured ?? false,
    isNew: seed.isNew ?? false,
    bestseller: seed.bestseller ?? false,
    releasedAt: seed.releasedAt,
    origin: "noir-original",
    commercialApproved: true,
    makerworldSource: "—",
    makerworldCreator: "NOIR ATELIER",
    makerworldLicense: "Авторская модель NOIR ATELIER",
    makerworldURL: "",
    productionFileId: `PF-${seed.id.replace("noir-", "").toUpperCase()}`,
  };
}

export const PRODUCTS: Product[] = [
  make({
    id: "noir-essential-01",
    name: "NOIR ESSENTIAL 01",
    collection: "essential",
    category: "planters",
    form: "ribbed",
    short: "Кашпо с вертикальным рифлением и спокойной классической пропорцией.",
    description:
      "Вертикальные рёбра собирают свет и маскируют слой печати, поэтому поверхность читается как матовый камень. Модель печатается с дренажным отверстием и съёмным поддоном.",
    primary: essential01,
    standard: 4900,
    smart: 6900,
    bestseller: true,
    featured: true,
    releasedAt: "2026-02-10",
  }),
  make({
    id: "noir-essential-02",
    name: "NOIR ESSENTIAL 02",
    collection: "essential",
    category: "planters",
    form: "twisted",
    short: "Узкое кашпо с непрерывной скрученной спиралью по корпусу.",
    description:
      "Спираль идёт от основания к кромке без разрыва — это одна из самых сложных для печати геометрий в линейке. Высокая форма хорошо работает на полу и на узкой консоли.",
    primary: essential02,
    standard: 5400,
    smart: 7400,
    isNew: true,
    releasedAt: "2026-08-18",
  }),
  make({
    id: "noir-essential-03",
    name: "NOIR ESSENTIAL 03",
    collection: "essential",
    category: "vases",
    form: "fluted",
    short: "Ваза с тонким флутованием и широким раструбом горловины.",
    description:
      "Круглое плечо переходит в раскрытый раструб — сухие травы и одиночные стебли держатся без секрета. Внутренняя полость герметична, воду можно наливать напрямую.",
    primary: essential03,
    standard: 6200,
    sizes: ["S", "M", "L"],
    releasedAt: "2026-03-02",
  }),
  make({
    id: "noir-essential-04",
    name: "NOIR ESSENTIAL 04",
    collection: "essential",
    category: "planters",
    form: "polygon",
    short: "Низкое широкое кашпо из polygon-граней с матовой поверхностью.",
    description:
      "Плоские грани ловят свет под разным углом, поэтому форма меняется в течение дня. Плотный корпус из PETG подходит для тяжёлых субстратов и крупных суккулентных композиций.",
    primary: essential04,
    standard: 5900,
    smart: 7900,
    material: "PETG",
    bestseller: true,
    releasedAt: "2026-05-14",
  }),
  make({
    id: "noir-flow-01",
    name: "NOIR FLOW 01",
    collection: "flow",
    category: "planters",
    form: "wavy",
    short: "Кашпо с мягкой волной, огибающей корпус по кругу.",
    description:
      "Волна задана одной непрерывной кривой, без стыков и углов. Ампельные растения красиво перегибаются через кромку, и изделие работает как живой акцент.",
    primary: flow01,
    standard: 5600,
    smart: 7600,
    featured: true,
    bestseller: true,
    releasedAt: "2026-04-06",
  }),
  make({
    id: "noir-flow-02",
    name: "NOIR FLOW 02",
    collection: "flow",
    category: "planters",
    form: "helical",
    short: "Высокое кашпо с крутым гелиоидальным рельефом.",
    description:
      "Рельеф закручен по вертикали и держит ритм от основания до верха. Пропорция рассчитана так, чтобы кашпо оставалось устойчивым при полной внутренней вставке.",
    primary: flow02,
    standard: 6400,
    smart: 8400,
    isNew: true,
    releasedAt: "2026-09-02",
  }),
  make({
    id: "noir-flow-03",
    name: "NOIR FLOW 03",
    collection: "flow",
    category: "vases",
    form: "spiral",
    short: "Высокая спиральная ваза с расходящейся горловиной.",
    description:
      "Спираль визуально вытягивает композицию вверх, а расходящаяся горловина удерживает пышные сухие букеты. Модель печатается в один непрерывный проход без поддержек.",
    primary: flow03,
    standard: 7200,
    sizes: ["S", "M", "L"],
    releasedAt: "2026-06-11",
  }),
  make({
    id: "noir-flow-04",
    name: "NOIR FLOW 04",
    collection: "flow",
    category: "planters",
    form: "drift",
    short: "Асимметричное кашпо-дрейф с низкой природной силуэтом.",
    description:
      "Форма повторяет обдуваемый ветром камень: один край выше, линия кромки живая. Такую модель обычно ставят одну, без пары, как центр композиции.",
    primary: flow04,
    standard: 7800,
    smart: 9800,
    material: "PETG",
    featured: true,
    releasedAt: "2026-07-21",
  }),
  make({
    id: "noir-soft-01",
    name: "NOIR SOFT 01",
    collection: "soft",
    category: "planters",
    form: "inflated",
    short: "Кашпо с надутым мягким объёмом и широкой низкой чашей.",
    description:
      "Пухлые стенки дают мягкую тень и приятны на ощупь — это самая тактильная модель линейки. Низкая посадка подходит для папоротников и мелких композиций.",
    primary: soft01,
    standard: 5800,
    smart: 7800,
    isNew: true,
    releasedAt: "2026-08-30",
  }),
  make({
    id: "noir-soft-02",
    name: "NOIR SOFT 02",
    collection: "soft",
    category: "planters",
    form: "soft-cloth",
    short: "Кашпо, повторяющее мягко драпированную ткань.",
    description:
      "Складки смоделированы вручную и напечатаны без склейки — корпус выглядит как вылепленный из глины. Каждая складка уникальна по глубине, поэтому свет никогда не ложится одинаково.",
    primary: soft02,
    standard: 6600,
    smart: 8600,
    releasedAt: "2026-05-30",
  }),
  make({
    id: "noir-soft-03",
    name: "NOIR SOFT 03",
    collection: "soft",
    category: "planters",
    form: "japandi",
    short: "Japandi-кашпо со скруглённым прямоугольным профилем.",
    description:
      "Мягкий квадрат хорошо встаёт в нишу, на тумбу или в ряд на подоконнике. Тонкий горизонтальный шов подчёркивает пропорцию и скрывает линию сборки вставки.",
    primary: soft03,
    standard: 6900,
    smart: 8900,
    material: "PETG",
    bestseller: true,
    releasedAt: "2026-03-24",
  }),
  make({
    id: "noir-soft-04",
    name: "NOIR SOFT 04",
    collection: "soft",
    category: "vases",
    form: "twisted-organic",
    short: "Ваза с мягким органическим заворотом и узким горлышком.",
    description:
      "Лёгкая асимметрия даёт эффект ручной работы, а узкое горло удерживает один-два стебля. Оттенок Terracotta в этой форме выглядит особенно глубоко.",
    primary: soft04,
    standard: 7400,
    sizes: ["S", "M", "L"],
    releasedAt: "2026-07-02",
  }),
  make({
    id: "noir-arch-01",
    name: "NOIR ARCH 01",
    collection: "architecture",
    category: "planters",
    form: "stacked-volumes",
    short: "Кашпо из смещённых прямоугольных объёмов.",
    description:
      "Четыре смещённых блока формируют башню с чёткой тенью — модель держит пространство как архитектурный акцент. Печатается из PETG, чтобы выдержать вес грунта в верхней части.",
    primary: arch01,
    standard: 9200,
    smart: 11200,
    material: "PETG",
    featured: true,
    releasedAt: "2026-06-25",
  }),
  make({
    id: "noir-arch-02",
    name: "NOIR ARCH 02",
    collection: "architecture",
    category: "planters",
    form: "faceted",
    short: "Низкая чаша с острой фасеточной геометрией минерала.",
    description:
      "Грани рассчитаны так, чтобы не пересекаться в одной точке света — рельеф читается с любого ракурса. Модель хороша для тилландсий, кактусов и небольших суккулентов.",
    primary: arch02,
    standard: 8400,
    smart: 10400,
    releasedAt: "2026-04-18",
  }),
  make({
    id: "noir-arch-03",
    name: "NOIR ARCH 03",
    collection: "architecture",
    category: "vases",
    form: "art-deco",
    short: "Ваза в духе Art Deco со ступенчатыми веерами.",
    description:
      "Веерные ступени поднимаются к узкому горлу, создавая плотный ритм теней. Это одна из самых долгих по печати моделей: рельеф требует минимальной высоты слоя.",
    primary: arch03,
    standard: 10600,
    sizes: ["S", "M", "L"],
    colors: ["graphite", "black", "stone", "ivory"],
    isNew: true,
    releasedAt: "2026-09-10",
  }),
  make({
    id: "noir-arch-04",
    name: "NOIR ARCH 04",
    collection: "architecture",
    category: "decor",
    form: "sculpture",
    short: "Декоративная скульптура: арка и сфера на общем основании.",
    description:
      "Чистый интерьерный объект без функциональной нагрузки — работает как маленькая архитектурная цитата. Поставляется в подарочной упаковке из переработанного картона.",
    primary: arch04,
    standard: 12400,
    sizes: ["S", "M"],
    releasedAt: "2026-02-28",
  }),
  make({
    id: "noir-smart-01",
    name: "NOIR SMART 01",
    collection: "smart",
    category: "smart",
    form: "self-watering",
    short: "Кашпо с автополивом и прозрачным окном уровня воды.",
    description:
      "Резервуар ориентировочно на 1 литр, капиллярная подача без фитилей, поплавковый индикатор и отметки MAX / MIN на окне. Долив воды — через верхнюю сервисную зону с крышкой.",
    primary: smart01,
    standard: 7900,
    smart: 9900,
    material: "PETG",
    bestseller: true,
    featured: true,
    releasedAt: "2026-01-20",
  }),
  make({
    id: "noir-smart-02",
    name: "NOIR SMART 02",
    collection: "smart",
    category: "smart",
    form: "self-watering-ribbed",
    short: "Крупное Smart-кашпо с вертикальным рифлением.",
    description:
      "Рассчитано на растения с активной корневой системой: объём резервуара увеличен, вставка опирается на верхний край и на центральную ножку. Прозрачное окно защищено от прямых лучей — вода не цветёт.",
    primary: smart02,
    standard: 9800,
    smart: 11800,
    material: "PETG",
    featured: true,
    releasedAt: "2026-08-05",
  }),
  make({
    id: "noir-smart-03",
    name: "NOIR SMART 03",
    collection: "smart",
    category: "smart",
    form: "self-watering-japandi",
    short: "Japandi Smart-кашпо с мягким прямоугольным профилем.",
    description:
      "Тот же механизм автополива в спокойной форме, которая встаёт в нишу или в ряд на подоконнике. Крышка заливного отверстия скрыта под кромкой и не видна с уровня глаз.",
    primary: smart03,
    standard: 8900,
    smart: 10900,
    material: "PETG",
    isNew: true,
    releasedAt: "2026-09-15",
  }),
  make({
    id: "noir-limited-01",
    name: "NOIR LIMITED 01",
    collection: "limited",
    category: "vases",
    form: "double-wall",
    short: "Ваза с двойной стенкой: внешний чёрный каркас и внутренний сосуд.",
    description:
      "Внешняя решётка и внутренний сосуд печатаются отдельно и собираются без клея. Серия лимитирована: за месяц выпускаем не более двенадцати изделий.",
    primary: limited01,
    standard: 18900,
    sizes: ["S", "M"],
    colors: ["black", "ivory", "graphite"],
    material: "PLA + PETG",
    featured: true,
    releasedAt: "2026-08-22",
  }),
  make({
    id: "noir-limited-02",
    name: "NOIR LIMITED 02",
    collection: "limited",
    category: "decor",
    form: "still-life",
    short: "Декоративная композиция: фасеточный сосуд и сфера на общем основании.",
    description:
      "Два объекта собраны в одну натюрмортную группу — их можно разъединить и использовать отдельно. Партия ограничена двадцатью изделиями, после чего модель уходит в архив.",
    primary: limited02,
    standard: 14500,
    sizes: ["S", "M"],
    colors: ["sage", "ivory", "sand", "graphite"],
    releasedAt: "2026-09-20",
  }),
];

/** Публичный каталог: только товары с подтверждённым коммерческим использованием. */
export const CATALOG: Product[] = PRODUCTS.filter((p) => p.commercialApproved);

export function getProductBySlug(slug: string): Product | undefined {
  return CATALOG.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getCollection(id: CollectionId) {
  return COLLECTIONS.find((c) => c.id === id);
}

export function priceFor(product: Product, size: SizeCode, system: ShopSystem): number {
  const base =
    system === "smart" && product.priceSmart !== null ? product.priceSmart : product.priceStandard;
  const raw = base * SIZE_MAP[size].multiplier;
  return Math.round(raw / 100) * 100;
}

export function smartDeltaFor(product: Product, size: SizeCode): number {
  if (!product.smartAvailable) return 0;
  return priceFor(product, size, "smart") - priceFor(product, size, "standard");
}

export function minPrice(product: Product): number {
  return Math.min(...product.sizes.map((s) => priceFor(product, s, "standard")));
}

export function maxPrice(product: Product): number {
  const systems: ShopSystem[] = product.smartAvailable
    ? ["standard", "smart"]
    : ["standard"];
  return Math.max(...product.sizes.flatMap((s) => systems.map((y) => priceFor(product, s, y))));
}

export const PRICE_BOUNDS = {
  min: Math.min(...CATALOG.map(minPrice)),
  max: Math.max(...CATALOG.map(maxPrice)),
};

export function skuFor(
  product: Product,
  size: SizeCode,
  bodyColor: ColorId,
  insertColor: ColorId,
  system: ShopSystem,
): string {
  const systemCode = system === "smart" ? "SM" : "ST";
  const sizeCode = size.padStart(2, "0");
  return `${product.sku}-${sizeCode}-${bodyColor.slice(0, 3).toUpperCase()}-${insertColor
    .slice(0, 3)
    .toUpperCase()}-${systemCode}`;
}

export function productionFor(product: Product, size: SizeCode, system: ShopSystem) {
  const s = SIZE_MAP[size];
  const smartBonus = system === "smart" ? 1 : 0;
  return {
    sku: product.sku,
    size: size,
    material: product.material,
    filamentGrams: Math.round(s.filamentGrams * (1 + smartBonus * 0.28)),
    printMinutes: Math.round(s.printMinutes * (1 + smartBonus * 0.35)),
    system,
    productionFileId: product.productionFileId,
  };
}

export type SortId = "popular" | "new" | "price-asc" | "price-desc";

export const SORTS: { id: SortId; label: string }[] = [
  { id: "popular", label: "Популярные" },
  { id: "new", label: "Новинки" },
  { id: "price-asc", label: "Цена ↑" },
  { id: "price-desc", label: "Цена ↓" },
];

export type Filters = {
  categories: CategoryId[];
  collections: CollectionId[];
  sizes: SizeCode[];
  colors: ColorId[];
  systems: ShopSystem[];
  priceMax: number;
  search: string;
  sort: SortId;
};

export const EMPTY_FILTERS: Filters = {
  categories: [],
  collections: [],
  sizes: [],
  colors: [],
  systems: [],
  priceMax: PRICE_BOUNDS.max,
  search: "",
  sort: "popular",
};

function matchesSearch(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const words = q.split(/\s+/);
  const haystack = [
    product.name,
    product.form,
    product.shortDescription,
    product.description,
    getCollection(product.collection)?.name ?? "",
    CATEGORIES.find((c) => c.id === product.category)?.label ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return words.every((w) => haystack.includes(w));
}

export function applyFilters(products: Product[], f: Filters): Product[] {
  const result = products.filter((p) => {
    if (!p.commercialApproved) return false;
    if (f.categories.length && !f.categories.includes(p.category)) return false;
    if (f.collections.length && !f.collections.includes(p.collection)) return false;
    if (f.sizes.length && !f.sizes.some((s) => p.sizes.includes(s))) return false;
    if (f.colors.length && !f.colors.some((c) => p.colors.includes(c))) return false;
    if (f.systems.length) {
      const available: ShopSystem[] = p.smartAvailable
        ? ["standard", "smart"]
        : ["standard"];
      if (!f.systems.some((s) => available.includes(s))) return false;
    }
    if (minPrice(p) > f.priceMax) return false;
    if (!matchesSearch(p, f.search)) return false;
    return true;
  });

  const sorted = [...result];
  switch (f.sort) {
    case "new":
      sorted.sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
      break;
    case "price-asc":
      sorted.sort((a, b) => minPrice(a) - minPrice(b));
      break;
    case "price-desc":
      sorted.sort((a, b) => maxPrice(b) - maxPrice(a));
      break;
    default:
      sorted.sort(
        (a, b) =>
          Number(b.bestseller) - Number(a.bestseller) ||
          Number(b.featured) - Number(a.featured) ||
          a.name.localeCompare(b.name, "ru"),
      );
  }
  return sorted;
}

export function searchProducts(query: string, limit = 6): Product[] {
  if (!query.trim()) return [];
  return applyFilters(CATALOG, { ...EMPTY_FILTERS, search: query }).slice(0, limit);
}

export const FEATURED = CATALOG.filter((p) => p.featured);
export const BESTSELLERS = CATALOG.filter((p) => p.bestseller);
export const NEW_ARRIVALS = [...CATALOG]
  .filter((p) => p.isNew)
  .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
