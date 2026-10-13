import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "./db";
import {
  collections,
  colors,
  materials,
  mediaAssets,
  orderItems,
  orderPayments,
  orders,
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
import { removeObject, uploadPublicObject } from "./storage";

export type AdminProductInput = {
  id?: string;
  slug: string;
  sku: string;
  collectionId: string | null;
  category: string;
  form: string;
  name: string;
  shortDescription: string;
  description: string;
  publicationStatus: "draft" | "published" | "hidden";
  isNew: boolean;
  isBestseller: boolean;
  isComingSoon: boolean;
  featured: boolean;
  colorIds: string[];
  materialNames: string[];
  mediaIds: string[];
  variants: {
    sizeCode: string;
    system: "standard" | "smart";
    price: number;
    productionDays: number;
    enabled: boolean;
    packageLengthCm?: number | null;
    packageWidthCm?: number | null;
    packageHeightCm?: number | null;
    packageWeightGrams?: number | null;
    measurements: {
      outerWidthMm?: number | null;
      outerDepthMm?: number | null;
      outerDiameterMm?: number | null;
      outerHeightMm?: number | null;
      innerWidthMm?: number | null;
      innerDepthMm?: number | null;
      innerDiameterMm?: number | null;
      innerHeightMm?: number | null;
      plantingVolumeMl?: number | null;
      reservoirVolumeMl?: number | null;
      weightGrams?: number | null;
      scaleReference?: "plant" | "person" | "interior" | "none";
    };
  }[];
  specifications: {
    sectionTitle: string;
    sectionOrder: number;
    code: string;
    label: string;
    value: string;
    unit?: string | null;
    sortOrder: number;
    variantKey?: string | null;
  }[];
};

function variantKey(variant: Pick<AdminProductInput["variants"][number], "sizeCode" | "system">) {
  return `${variant.sizeCode}:${variant.system}`;
}

function cleanSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getAdminSnapshot() {
  const db = getDb();
  const [
    collectionRows,
    productRows,
    variants,
    measurements,
    specificationSections,
    specifications,
    colorLinks,
    materialLinks,
    imageLinks,
    media,
    sizeRows,
    colorRows,
    materialRows,
    orderRows,
  ] = await Promise.all([
    db
      .select({ collection: collections, coverUrl: mediaAssets.publicUrl })
      .from(collections)
      .leftJoin(mediaAssets, eq(collections.coverMediaId, mediaAssets.id))
      .orderBy(asc(collections.name)),
    db
      .select({ product: products, collectionName: collections.name })
      .from(products)
      .leftJoin(collections, eq(products.collectionId, collections.id))
      .orderBy(desc(products.updatedAt)),
    db.select().from(productVariants),
    db.select().from(productVariantMeasurements),
    db
      .select()
      .from(productSpecificationSections)
      .orderBy(asc(productSpecificationSections.sortOrder)),
    db.select().from(productSpecifications).orderBy(asc(productSpecifications.sortOrder)),
    db
      .select({ productId: productColors.productId, colorId: productColors.colorId })
      .from(productColors),
    db
      .select({ productId: productMaterials.productId, materialName: materials.name })
      .from(productMaterials)
      .innerJoin(materials, eq(productMaterials.materialId, materials.id)),
    db
      .select({
        productId: productImages.productId,
        mediaId: productImages.mediaId,
        sortOrder: productImages.sortOrder,
      })
      .from(productImages)
      .orderBy(asc(productImages.sortOrder)),
    db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)),
    db.select().from(sizes).orderBy(asc(sizes.sortOrder)),
    db.select().from(colors).orderBy(asc(colors.sortOrder)),
    db.select().from(materials).orderBy(asc(materials.name)),
    db.select().from(orders).orderBy(desc(orders.createdAt)),
  ]);
  const orderIds = orderRows.map((order) => order.id);
  const items = orderIds.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
    : [];
  const payments = orderIds.length
    ? await db.select().from(orderPayments).where(inArray(orderPayments.orderId, orderIds))
    : [];
  return {
    collections: collectionRows.map(({ collection, coverUrl }) => ({ ...collection, coverUrl })),
    products: productRows.map(({ product, collectionName }) => ({
      ...product,
      collectionName: collectionName ?? "Без коллекции",
      variants: variants.filter((item) => item.productId === product.id),
      specifications: specificationSections
        .filter((section) => section.productId === product.id)
        .flatMap((section) =>
          specifications
            .filter((specification) => specification.sectionId === section.id)
            .map((specification) => ({
              ...specification,
              sectionTitle: section.title,
              sectionOrder: section.sortOrder,
              variantKey: specification.variantId
                ? (() => {
                    const variant = variants.find((item) => item.id === specification.variantId);
                    return variant ? variantKey(variant) : null;
                  })()
                : null,
            })),
        ),
      measurements: measurements.filter((measurement) =>
        variants.some(
          (variant) => variant.productId === product.id && variant.id === measurement.variantId,
        ),
      ),
      colorIds: colorLinks
        .filter((item) => item.productId === product.id)
        .map((item) => item.colorId),
      materialNames: materialLinks
        .filter((item) => item.productId === product.id)
        .map((item) => item.materialName),
      mediaIds: imageLinks
        .filter((item) => item.productId === product.id)
        .map((item) => item.mediaId),
    })),
    media,
    sizes: sizeRows,
    colors: colorRows,
    materials: materialRows,
    orders: orderRows.map((order) => ({
      ...order,
      items: items.filter((item) => item.orderId === order.id),
      payments: payments.filter((payment) => payment.orderId === order.id),
    })),
  };
}

export async function saveProduct(input: AdminProductInput) {
  const db = getDb();
  const slug = cleanSlug(input.slug);
  if (!slug || !input.name.trim() || !input.sku.trim())
    throw new Error("Заполните название, slug и SKU.");
  if (!input.variants.length) throw new Error("Добавьте хотя бы один вариант товара.");
  const values = {
    slug,
    sku: input.sku.trim(),
    collectionId: input.collectionId,
    category: input.category.trim() || "decor",
    form: input.form.trim(),
    name: input.name.trim(),
    shortDescription: input.shortDescription.trim(),
    description: input.description.trim(),
    publicationStatus: input.publicationStatus,
    isNew: input.isNew,
    isBestseller: input.isBestseller,
    isComingSoon: input.isComingSoon,
    featured: input.featured,
    updatedAt: new Date(),
  } as const;
  const id = await db.transaction(async (tx) => {
    const productId = input.id
      ? input.id
      : (await tx.insert(products).values(values).returning({ id: products.id }))[0]!.id;
    if (input.id) await tx.update(products).set(values).where(eq(products.id, productId));
    await Promise.all([
      tx.delete(productVariants).where(eq(productVariants.productId, productId)),
      tx.delete(productColors).where(eq(productColors.productId, productId)),
      tx.delete(productMaterials).where(eq(productMaterials.productId, productId)),
      tx.delete(productImages).where(eq(productImages.productId, productId)),
      tx
        .delete(productSpecificationSections)
        .where(eq(productSpecificationSections.productId, productId)),
    ]);
    const createdVariants = await tx
      .insert(productVariants)
      .values(
        input.variants.map(({ measurements: _measurements, ...variant }) => ({
          ...variant,
          productId,
        })),
      )
      .returning();
    await tx.insert(productVariantMeasurements).values(
      createdVariants.map((variant) => {
        const source = input.variants.find((item) => variantKey(item) === variantKey(variant))!;
        return { variantId: variant.id, ...source.measurements, updatedAt: new Date() };
      }),
    );
    const variantIds = new Map(createdVariants.map((variant) => [variantKey(variant), variant.id]));
    const groupedSpecifications = input.specifications.reduce((groups, item) => {
      const key = `${item.sectionOrder}:${item.sectionTitle.trim()}`;
      const group = groups.get(key) ?? [];
      group.push(item);
      groups.set(key, group);
      return groups;
    }, new Map<string, AdminProductInput["specifications"]>());
    for (const [, group] of groupedSpecifications) {
      const first = group?.[0];
      if (!first) continue;
      const [section] = await tx
        .insert(productSpecificationSections)
        .values({
          productId,
          title: first.sectionTitle.trim(),
          sortOrder: first.sectionOrder,
          updatedAt: new Date(),
        })
        .returning({ id: productSpecificationSections.id });
      await tx.insert(productSpecifications).values(
        group.map((specification) => {
          const variantId = specification.variantKey
            ? variantIds.get(specification.variantKey)
            : null;
          if (specification.variantKey && !variantId)
            throw new Error(`Не найден вариант для характеристики ${specification.label}.`);
          return {
            sectionId: section!.id,
            variantId,
            code: specification.code.trim(),
            label: specification.label.trim(),
            value: specification.value.trim(),
            unit: specification.unit?.trim() || null,
            sortOrder: specification.sortOrder,
            updatedAt: new Date(),
          };
        }),
      );
    }
    if (input.colorIds.length)
      await tx
        .insert(productColors)
        .values(input.colorIds.map((colorId) => ({ productId, colorId })));
    for (const materialName of [
      ...new Set(input.materialNames.map((item) => item.trim()).filter(Boolean)),
    ]) {
      const [material] = await tx
        .insert(materials)
        .values({ name: materialName, updatedAt: new Date() })
        .onConflictDoUpdate({ target: materials.name, set: { updatedAt: new Date() } })
        .returning({ id: materials.id });
      await tx.insert(productMaterials).values({ productId, materialId: material!.id });
    }
    if (input.mediaIds.length)
      await tx
        .insert(productImages)
        .values(input.mediaIds.map((mediaId, sortOrder) => ({ productId, mediaId, sortOrder })));
    return productId;
  });
  return { id };
}

export async function deleteProduct(id: string) {
  await getDb().delete(products).where(eq(products.id, id));
}

export async function saveCollection(input: {
  id?: string;
  slug: string;
  name: string;
  title: string;
  tagline: string;
  description: string;
  coverMediaId: string | null;
}) {
  const db = getDb();
  const values = { ...input, id: undefined, slug: cleanSlug(input.slug), updatedAt: new Date() };
  if (!values.slug || !values.name.trim()) throw new Error("Заполните slug и название коллекции.");
  if (input.id) {
    await db
      .update(collections)
      .set({ ...values, id: undefined })
      .where(eq(collections.id, input.id));
    return { id: input.id };
  }
  const [created] = await db
    .insert(collections)
    .values({ ...values, id: undefined })
    .returning({ id: collections.id });
  return { id: created!.id };
}

export async function deleteCollection(id: string) {
  await getDb().delete(collections).where(eq(collections.id, id));
}

export async function saveReference(input: {
  type: "size" | "color" | "material";
  id?: string;
  label: string;
  hex?: string;
  sortOrder?: number;
}) {
  const db = getDb();
  if (input.type === "size") {
    const code = (input.id ?? input.label).trim().toUpperCase();
    await db
      .insert(sizes)
      .values({
        code,
        label: input.label.trim(),
        sortOrder: input.sortOrder ?? 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sizes.code,
        set: { label: input.label.trim(), sortOrder: input.sortOrder ?? 0, updatedAt: new Date() },
      });
    return;
  }
  if (input.type === "color") {
    const id = cleanSlug(input.id ?? input.label);
    const hex = input.hex?.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex ?? ""))
      throw new Error("Цвет должен быть в формате #RRGGBB.");
    await db
      .insert(colors)
      .values({
        id,
        label: input.label.trim(),
        hex: hex!,
        sortOrder: input.sortOrder ?? 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: colors.id,
        set: {
          label: input.label.trim(),
          hex: hex!,
          sortOrder: input.sortOrder ?? 0,
          updatedAt: new Date(),
        },
      });
    return;
  }
  const name = input.label.trim();
  await db
    .insert(materials)
    .values({ name, updatedAt: new Date() })
    .onConflictDoUpdate({ target: materials.name, set: { updatedAt: new Date() } });
}

export async function deleteReference(input: { type: "size" | "color" | "material"; id: string }) {
  const db = getDb();
  if (input.type === "size") await db.delete(sizes).where(eq(sizes.code, input.id));
  else if (input.type === "color") await db.delete(colors).where(eq(colors.id, input.id));
  else await db.delete(materials).where(eq(materials.id, input.id));
}

export async function uploadMedia(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Можно загрузить только изображение.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Максимальный размер файла — 12 МБ.");
  const uploaded = await uploadPublicObject({
    body: new Uint8Array(await file.arrayBuffer()),
    fileName: file.name,
    contentType: file.type,
  });
  const [media] = await getDb()
    .insert(mediaAssets)
    .values({ ...uploaded, fileName: file.name, contentType: file.type, byteSize: file.size })
    .returning();
  return media!;
}

export async function deleteMedia(id: string) {
  const db = getDb();
  const [media] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id));
  if (!media) return;
  const [usedByProduct] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.mediaId, id))
    .limit(1);
  const [usedByCollection] = await db
    .select()
    .from(collections)
    .where(eq(collections.coverMediaId, id))
    .limit(1);
  if (usedByProduct || usedByCollection)
    throw new Error("Фото используется товаром или коллекцией.");
  await removeObject(media.objectKey);
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
}

export async function updateOrderStatus(
  id: string,
  status: "new" | "in_progress" | "awaiting_customer" | "ready" | "completed" | "cancelled",
) {
  await getDb().update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id));
}

export async function updateOrderDelivery(id: string, trackingNumber: string) {
  const [order] = await getDb()
    .update(orders)
    .set({ cdekTrackingNumber: trackingNumber.trim() || null, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning({ id: orders.id });
  if (!order) throw new Error("Заказ не найден.");
  return order;
}

export async function confirmDeliveryReceipt(id: string) {
  const db = getDb();
  const [order] = await db
    .select({ id: orders.id, mode: orders.deliveryPaymentMode })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  if (!order || order.mode !== "on_receipt")
    throw new Error("Для этого заказа нет оплаты доставки при получении.");
  const [payment] = await db
    .update(orderPayments)
    .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(orderPayments.orderId, id),
        eq(orderPayments.component, "delivery"),
        eq(orderPayments.status, "awaiting_receipt"),
      ),
    )
    .returning({ id: orderPayments.id });
  if (!payment) throw new Error("Оплата доставки уже подтверждена или не найдена.");
  return payment;
}
