import { and, eq } from "drizzle-orm";

import { getDb } from "./db";
import {
  colors,
  orderItems,
  orders,
  productColors,
  products,
  productSpecificationSections,
  productSpecifications,
  productVariantMeasurements,
  productVariants,
} from "./schema";
import { EMPTY_MEASUREMENTS, resolveSpecifications } from "@/lib/product-details";

export type CheckoutItem = {
  productId: string;
  variantId: string;
  colorId: string;
  quantity: number;
};

export async function createOrder(input: {
  customerName: string;
  phone: string;
  email?: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  comment?: string;
  items: CheckoutItem[];
}) {
  const db = getDb();
  if (!input.items.length) throw new Error("Корзина пуста.");
  const snapshots = await Promise.all(
    input.items.map(async (item) => {
      const [variant] = await db
        .select({ variant: productVariants, product: products })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(
          and(
            eq(productVariants.id, item.variantId),
            eq(productVariants.productId, item.productId),
          ),
        )
        .limit(1);
      if (
        !variant ||
        variant.product.publicationStatus !== "published" ||
        variant.product.isComingSoon ||
        !variant.variant.enabled
      )
        throw new Error("Один из товаров больше недоступен для заказа.");
      const [color] = await db
        .select({ color: colors })
        .from(productColors)
        .innerJoin(colors, eq(productColors.colorId, colors.id))
        .where(
          and(eq(productColors.productId, item.productId), eq(productColors.colorId, item.colorId)),
        )
        .limit(1);
      if (!color) throw new Error("Выбранный цвет недоступен.");
      const quantity = Math.max(1, Math.min(99, Math.floor(item.quantity)));
      const [measurements, specificationRows] = await Promise.all([
        db
          .select()
          .from(productVariantMeasurements)
          .where(eq(productVariantMeasurements.variantId, variant.variant.id))
          .limit(1),
        db
          .select({ section: productSpecificationSections, specification: productSpecifications })
          .from(productSpecificationSections)
          .innerJoin(
            productSpecifications,
            eq(productSpecifications.sectionId, productSpecificationSections.id),
          )
          .where(eq(productSpecificationSections.productId, variant.product.id)),
      ]);
      const sections = specificationRows.reduce<
        {
          id: string;
          title: string;
          sortOrder: number;
          items: (typeof specificationRows)[number]["specification"][];
        }[]
      >((result, row) => {
        const existing = result.find((section) => section.id === row.section.id);
        if (existing) existing.items.push(row.specification);
        else
          result.push({
            id: row.section.id,
            title: row.section.title,
            sortOrder: row.section.sortOrder,
            items: [row.specification],
          });
        return result;
      }, []);
      return {
        product: variant.product,
        variant: variant.variant,
        color: color.color,
        quantity,
        measurements: measurements[0] ?? EMPTY_MEASUREMENTS,
        specifications: resolveSpecifications(sections, variant.variant.id),
      };
    }),
  );
  const total = snapshots.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        customerName: input.customerName.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        deliveryMethod: input.deliveryMethod.trim(),
        deliveryAddress: input.deliveryAddress?.trim() || null,
        comment: input.comment?.trim() || null,
        total,
      })
      .returning({ id: orders.id, number: orders.number });
    await tx.insert(orderItems).values(
      snapshots.map((item) => ({
        orderId: order!.id,
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        sizeCode: item.variant.sizeCode,
        system: item.variant.system,
        colorName: item.color.label,
        unitPrice: item.variant.price,
        quantity: item.quantity,
        snapshot: {
          productSlug: item.product.slug,
          variantId: item.variant.id,
          productionDays: item.variant.productionDays,
          color: item.color,
          measurements: item.measurements,
          specifications: item.specifications,
        },
      })),
    );
    return order!;
  });
}
