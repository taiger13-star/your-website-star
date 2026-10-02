import "dotenv/config";

import { createServer } from "vite";
import { eq } from "drizzle-orm";

import { closeDb, getDb } from "./db";
import {
  collections,
  colors,
  materials,
  mediaAssets,
  productColors,
  productImages,
  productMaterials,
  productSpecificationSections,
  productSpecifications,
  productVariantMeasurements,
  products,
  productVariants,
  sizes,
} from "./schema";
import { ensurePublicBucket, uploadPublicObject } from "./storage";

type StaticProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  collection: string;
  category: string;
  form: string;
  shortDescription: string;
  description: string;
  images: string[];
  sizes: string[];
  colors: string[];
  smartAvailable: boolean;
  material: string;
  featured: boolean;
  isNew: boolean;
  bestseller: boolean;
  releasedAt: string;
};

type SeedVariant = {
  id: string;
  sizeCode: string;
  system: "standard" | "smart";
};

function measurementsFor(item: StaticProduct, sizeCode: string, system: "standard" | "smart") {
  const size = (SIZES_BY_CODE.get(sizeCode) ?? { diameter: 160, height: 160 }) as {
    diameter: number;
    height: number;
  };
  const rectangular = /rectangular|arch|sculpture/.test(item.form);
  const outerHeightMm = Math.round(size.height * (item.category === "vases" ? 1.35 : 1));
  const diameter = size.diameter;
  const plantingVolumeMl = Math.round((Math.PI * (diameter * 0.42) ** 2 * outerHeightMm) / 1000);
  return {
    outerWidthMm: rectangular ? diameter : null,
    outerDepthMm: rectangular ? Math.round(diameter * 0.72) : null,
    outerDiameterMm: rectangular ? null : diameter,
    outerHeightMm,
    innerWidthMm: rectangular ? diameter - 16 : null,
    innerDepthMm: rectangular ? Math.round(diameter * 0.72) - 16 : null,
    innerDiameterMm: rectangular ? null : diameter - 16,
    innerHeightMm: Math.max(60, outerHeightMm - 18),
    plantingVolumeMl: item.category === "planters" ? plantingVolumeMl : null,
    reservoirVolumeMl: system === "smart" ? Math.round(plantingVolumeMl * 0.38) : null,
    weightGrams: Math.round(size.diameter * (system === "smart" ? 4.8 : 3.6)),
    scaleReference: diameter >= 200 ? "person" : "plant",
  } as const;
}

function demoSpecifications(item: StaticProduct, variants: SeedVariant[]) {
  const rows: {
    sectionTitle: string;
    sectionOrder: number;
    code: string;
    label: string;
    value: string;
    unit?: string;
    sortOrder: number;
    variantKey?: string;
  }[] = [
    {
      sectionTitle: "Объект",
      sectionOrder: 0,
      code: "material",
      label: "Материал",
      value: item.material,
      sortOrder: 0,
    },
    {
      sectionTitle: "Производство и уход",
      sectionOrder: 2,
      code: "production",
      label: "Производство",
      value: "5–7",
      unit: "рабочих дней",
      sortOrder: 0,
    },
    {
      sectionTitle: "Производство и уход",
      sectionOrder: 2,
      code: "warranty",
      label: "Гарантия",
      value: "12",
      unit: "месяцев",
      sortOrder: 1,
    },
    {
      sectionTitle: "Производство и уход",
      sectionOrder: 2,
      code: "care",
      label: "Уход",
      value: "Мягкая ткань и нейтральное моющее средство",
      sortOrder: 2,
    },
    {
      sectionTitle: "Производство и уход",
      sectionOrder: 2,
      code: "country",
      label: "Страна производства",
      value: "Россия",
      sortOrder: 3,
    },
  ];
  if (item.category === "planters") {
    rows.push(
      {
        sectionTitle: "Посадка и среда",
        sectionOrder: 1,
        code: "use",
        label: "Назначение",
        value: "Интерьер",
        sortOrder: 0,
      },
      {
        sectionTitle: "Посадка и среда",
        sectionOrder: 1,
        code: "moisture",
        label: "Влагостойкость",
        value: "Да",
        sortOrder: 1,
      },
      {
        sectionTitle: "Посадка и среда",
        sectionOrder: 1,
        code: "temperature",
        label: "Рабочая температура",
        value: "от +5 до +40",
        unit: "°C",
        sortOrder: 2,
      },
    );
  }
  for (const variant of variants) {
    const smart = variant.system === "smart";
    rows.push({
      sectionTitle: "Комплектация",
      sectionOrder: 1,
      code: "components",
      label: "Комплектация",
      value: smart ? "Корпус, вставка, поддон, резервуар" : "Корпус и поддон",
      sortOrder: 0,
      variantKey: `${variant.sizeCode}:${variant.system}`,
    });
    if (item.category === "planters")
      rows.push({
        sectionTitle: "Комплектация",
        sectionOrder: 1,
        code: "drainage",
        label: "Дренаж",
        value: smart ? "Внутренняя посадочная вставка" : "Есть",
        sortOrder: 1,
        variantKey: `${variant.sizeCode}:${variant.system}`,
      });
    if (smart) {
      const measurement = measurementsFor(item, variant.sizeCode, variant.system);
      rows.push(
        {
          sectionTitle: "NOIR SMART",
          sectionOrder: 1,
          code: "reservoir",
          label: "SMART-резервуар",
          value: String(measurement.reservoirVolumeMl ?? 0),
          unit: "мл",
          sortOrder: 0,
          variantKey: `${variant.sizeCode}:${variant.system}`,
        },
        {
          sectionTitle: "NOIR SMART",
          sectionOrder: 1,
          code: "fill",
          label: "Система долива",
          value: "Верхняя",
          sortOrder: 1,
          variantKey: `${variant.sizeCode}:${variant.system}`,
        },
        {
          sectionTitle: "NOIR SMART",
          sectionOrder: 1,
          code: "indicator",
          label: "Индикатор",
          value: "Поплавковый MIN/MAX",
          sortOrder: 2,
          variantKey: `${variant.sizeCode}:${variant.system}`,
        },
      );
    }
  }
  return rows;
}

const SIZES_BY_CODE = new Map<string, { diameter: number; height: number }>([
  ["S", { diameter: 120, height: 120 }],
  ["M", { diameter: 160, height: 160 }],
  ["L", { diameter: 200, height: 200 }],
  ["XL", { diameter: 240, height: 240 }],
]);

async function main() {
  const db = getDb();
  await ensurePublicBucket();
  const vite = await createServer({
    configFile: "vite.config.ts",
    server: { middlewareMode: true },
    appType: "custom",
  });
  try {
    const catalog = (await vite.ssrLoadModule(
      "/src/lib/catalog.ts",
    )) as typeof import("../lib/catalog");
    const staticProducts = catalog.PRODUCTS as StaticProduct[];
    for (const [index, size] of catalog.SIZES.entries()) {
      await db
        .insert(sizes)
        .values({ code: size.code, label: size.label, sortOrder: index, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: sizes.code,
          set: { label: size.label, sortOrder: index, updatedAt: new Date() },
        });
    }
    for (const [index, color] of catalog.BODY_COLORS.entries()) {
      await db
        .insert(colors)
        .values({
          id: color.id,
          label: color.label,
          hex: color.mix,
          sortOrder: index,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: colors.id,
          set: { label: color.label, hex: color.mix, sortOrder: index, updatedAt: new Date() },
        });
    }
    const mediaBySource = new Map<string, string>();
    async function importAsset(source: string) {
      const existing = mediaBySource.get(source);
      if (existing) return existing;
      const filePath = new URL(`../..${source}`, import.meta.url);
      const buffer = await (await import("node:fs/promises")).readFile(filePath);
      const name = source.split("/").pop() ?? "image.jpg";
      const uploaded = await uploadPublicObject({
        body: buffer,
        fileName: name,
        contentType: "image/jpeg",
      });
      const [asset] = await db
        .insert(mediaAssets)
        .values({
          ...uploaded,
          fileName: name,
          contentType: "image/jpeg",
          byteSize: buffer.byteLength,
        })
        .onConflictDoNothing({ target: mediaAssets.objectKey })
        .returning({ id: mediaAssets.id });
      const mediaId =
        asset?.id ??
        (
          await db
            .select({ id: mediaAssets.id })
            .from(mediaAssets)
            .where(eq(mediaAssets.objectKey, uploaded.objectKey))
        )[0]!.id;
      mediaBySource.set(source, mediaId);
      return mediaId;
    }
    const collectionIds = new Map<string, string>();
    for (const item of catalog.COLLECTIONS) {
      const coverMediaId = await importAsset(item.cover);
      const [row] = await db
        .insert(collections)
        .values({
          slug: item.id,
          name: item.name,
          title: item.title,
          tagline: item.tagline,
          description: item.description,
          coverMediaId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: collections.slug,
          set: {
            name: item.name,
            title: item.title,
            tagline: item.tagline,
            description: item.description,
            coverMediaId,
            updatedAt: new Date(),
          },
        })
        .returning({ id: collections.id });
      collectionIds.set(item.id, row!.id);
    }
    for (const item of staticProducts) {
      const [material] = await db
        .insert(materials)
        .values({ name: item.material, updatedAt: new Date() })
        .onConflictDoUpdate({ target: materials.name, set: { updatedAt: new Date() } })
        .returning({ id: materials.id });
      const [product] = await db
        .insert(products)
        .values({
          slug: item.slug,
          sku: item.sku,
          collectionId: collectionIds.get(item.collection) ?? null,
          category: item.category,
          form: item.form,
          name: item.name,
          shortDescription: item.shortDescription,
          description: item.description,
          publicationStatus: "published",
          isNew: item.isNew,
          isBestseller: item.bestseller,
          featured: item.featured,
          releasedAt: new Date(item.releasedAt),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: products.slug,
          set: {
            sku: item.sku,
            collectionId: collectionIds.get(item.collection) ?? null,
            category: item.category,
            form: item.form,
            name: item.name,
            shortDescription: item.shortDescription,
            description: item.description,
            publicationStatus: "published",
            isNew: item.isNew,
            isBestseller: item.bestseller,
            featured: item.featured,
            updatedAt: new Date(),
          },
        })
        .returning({ id: products.id });
      const productId = product!.id;
      await Promise.all([
        db.delete(productVariants).where(eq(productVariants.productId, productId)),
        db.delete(productColors).where(eq(productColors.productId, productId)),
        db.delete(productMaterials).where(eq(productMaterials.productId, productId)),
        db.delete(productImages).where(eq(productImages.productId, productId)),
      ]);
      await db.insert(productMaterials).values({ productId, materialId: material!.id });
      await db.insert(productColors).values(item.colors.map((colorId) => ({ productId, colorId })));
      const variants = item.sizes.flatMap((sizeCode) => {
        const standard = catalog.priceFor(item as never, sizeCode as never, "standard");
        const systems: {
          productId: string;
          sizeCode: string;
          system: "standard" | "smart";
          price: number;
          productionDays: number;
          enabled: boolean;
        }[] = [
          {
            productId,
            sizeCode,
            system: "standard",
            price: standard,
            productionDays: 7,
            enabled: true,
          },
        ];
        if (item.smartAvailable)
          systems.push({
            productId,
            sizeCode,
            system: "smart" as const,
            price: catalog.priceFor(item as never, sizeCode as never, "smart"),
            productionDays: 10,
            enabled: true,
          });
        return systems;
      });
      const createdVariants = await db.insert(productVariants).values(variants).returning({
        id: productVariants.id,
        sizeCode: productVariants.sizeCode,
        system: productVariants.system,
      });
      await db.insert(productVariantMeasurements).values(
        createdVariants.map((variant) => ({
          variantId: variant.id,
          ...measurementsFor(item, variant.sizeCode, variant.system),
          updatedAt: new Date(),
        })),
      );
      const sectionsByKey = new Map<string, string>();
      const variantIds = new Map(
        createdVariants.map((variant) => [`${variant.sizeCode}:${variant.system}`, variant.id]),
      );
      for (const specification of demoSpecifications(item, createdVariants)) {
        const sectionKey = `${specification.sectionOrder}:${specification.sectionTitle}`;
        let sectionId = sectionsByKey.get(sectionKey);
        if (!sectionId) {
          const [section] = await db
            .insert(productSpecificationSections)
            .values({
              productId,
              title: specification.sectionTitle,
              sortOrder: specification.sectionOrder,
              updatedAt: new Date(),
            })
            .returning({ id: productSpecificationSections.id });
          sectionId = section!.id;
          sectionsByKey.set(sectionKey, sectionId);
        }
        await db.insert(productSpecifications).values({
          sectionId,
          variantId: specification.variantKey
            ? (variantIds.get(specification.variantKey) ?? null)
            : null,
          code: specification.code,
          label: specification.label,
          value: specification.value,
          unit: specification.unit ?? null,
          sortOrder: specification.sortOrder,
          updatedAt: new Date(),
        });
      }
      const images = await Promise.all(item.images.map(importAsset));
      await db
        .insert(productImages)
        .values(images.map((mediaId, sortOrder) => ({ productId, mediaId, sortOrder })));
    }
    console.log(
      `Seeded ${staticProducts.length} products and ${catalog.COLLECTIONS.length} collections.`,
    );
  } finally {
    await vite.close();
    await closeDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
