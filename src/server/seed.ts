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
      await db.insert(productVariants).values(variants);
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
