import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "./db";
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

export type PublicCollection = {
  id: string;
  slug: string;
  name: string;
  title: string;
  tagline: string;
  description: string;
  cover: string | null;
};

export type PublicProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  collectionId: string | null;
  collectionSlug: string | null;
  collectionName: string;
  collectionTagline: string;
  category: string;
  form: string;
  shortDescription: string;
  description: string;
  images: string[];
  colors: { id: string; label: string; hex: string }[];
  materials: string[];
  variants: {
    id: string;
    sizeCode: string;
    system: "standard" | "smart";
    price: number;
    productionDays: number;
  }[];
  isNew: boolean;
  isBestseller: boolean;
  isComingSoon: boolean;
  featured: boolean;
  releasedAt: string;
};

export type CatalogSnapshot = {
  collections: PublicCollection[];
  products: PublicProduct[];
  sizes: { code: string; label: string }[];
  colors: { id: string; label: string; hex: string }[];
};

export async function getPublicCatalog(): Promise<CatalogSnapshot> {
  const db = getDb();
  const [collectionRows, productRows, sizeRows, colorRows] = await Promise.all([
    db
      .select({ collection: collections, cover: mediaAssets.publicUrl })
      .from(collections)
      .leftJoin(mediaAssets, eq(collections.coverMediaId, mediaAssets.id))
      .orderBy(asc(collections.name)),
    db
      .select({ product: products, collection: collections })
      .from(products)
      .leftJoin(collections, eq(products.collectionId, collections.id))
      .where(eq(products.publicationStatus, "published"))
      .orderBy(desc(products.isBestseller), desc(products.featured), asc(products.name)),
    db.select().from(sizes).orderBy(asc(sizes.sortOrder)),
    db.select().from(colors).orderBy(asc(colors.sortOrder)),
  ]);
  const ids = productRows.map((row) => row.product.id);
  const [variantRows, imageRows, colorLinks, materialLinks] = ids.length
    ? await Promise.all([
        db
          .select()
          .from(productVariants)
          .where(and(inArray(productVariants.productId, ids), eq(productVariants.enabled, true))),
        db
          .select({
            productId: productImages.productId,
            url: mediaAssets.publicUrl,
            sortOrder: productImages.sortOrder,
          })
          .from(productImages)
          .innerJoin(mediaAssets, eq(productImages.mediaId, mediaAssets.id))
          .where(inArray(productImages.productId, ids))
          .orderBy(asc(productImages.sortOrder)),
        db
          .select({ productId: productColors.productId, color: colors })
          .from(productColors)
          .innerJoin(colors, eq(productColors.colorId, colors.id))
          .where(inArray(productColors.productId, ids)),
        db
          .select({ productId: productMaterials.productId, material: materials.name })
          .from(productMaterials)
          .innerJoin(materials, eq(productMaterials.materialId, materials.id))
          .where(inArray(productMaterials.productId, ids)),
      ])
    : [[], [], [], []];

  return {
    collections: collectionRows.map(({ collection, cover }) => ({ ...collection, cover })),
    sizes: sizeRows.map(({ code, label }) => ({ code, label })),
    colors: colorRows.map(({ id, label, hex }) => ({ id, label, hex })),
    products: productRows.map(({ product, collection }) => ({
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      collectionId: product.collectionId,
      collectionSlug: collection?.slug ?? null,
      collectionName: collection?.name ?? "Без коллекции",
      collectionTagline: collection?.tagline ?? "",
      category: product.category,
      form: product.form,
      shortDescription: product.shortDescription,
      description: product.description,
      images: imageRows.filter((row) => row.productId === product.id).map((row) => row.url),
      colors: colorLinks.filter((row) => row.productId === product.id).map((row) => row.color),
      materials: materialLinks
        .filter((row) => row.productId === product.id)
        .map((row) => row.material),
      variants: variantRows
        .filter((row) => row.productId === product.id)
        .map(({ id, sizeCode, system, price, productionDays }) => ({
          id,
          sizeCode,
          system,
          price,
          productionDays,
        })),
      isNew: product.isNew,
      isBestseller: product.isBestseller,
      isComingSoon: product.isComingSoon,
      featured: product.featured,
      releasedAt: product.releasedAt.toISOString(),
    })),
  };
}
