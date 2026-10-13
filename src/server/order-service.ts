import { and, eq } from "drizzle-orm";

import { getDb } from "./db";
import { calculateCdekDelivery } from "./cdek-service";
import {
  colors,
  orderItems,
  orderPayments,
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
  userId: string;
  checkoutKey: string;
  customerName: string;
  phone: string;
  email?: string;
  deliveryPaymentMode: "prepaid" | "on_receipt";
  expectedSubtotal: number;
  expectedDeliveryCost: number;
  expectedTariffCode: number;
  expectedCurrency: string;
  delivery: {
    method: "cdek_pvz" | "cdek_courier";
    cityCode: number;
    cityName: string;
    pickupPointCode?: string;
    deliveryAddress?: string;
  };
  comment?: string;
  items: CheckoutItem[];
}) {
  const db = getDb();
  const [existing] = await db
    .select({ id: orders.id, number: orders.number })
    .from(orders)
    .where(and(eq(orders.userId, input.userId), eq(orders.checkoutKey, input.checkoutKey)))
    .limit(1);
  if (existing) return { kind: "created" as const, order: existing };
  if (!input.items.length) throw new Error("Корзина пуста.");
  const delivery = await calculateCdekDelivery({
    ...input.delivery,
    items: input.items.map(({ productId, variantId, quantity }) => ({
      productId,
      variantId,
      quantity,
    })),
  });
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
  if (
    input.expectedSubtotal !== total ||
    input.expectedDeliveryCost !== delivery.cost ||
    input.expectedTariffCode !== delivery.tariffCode ||
    input.expectedCurrency !== delivery.currency
  ) {
    return {
      kind: "changed" as const,
      subtotal: total,
      delivery,
      itemPrices: snapshots.map((item) => ({
        productId: item.product.id,
        variantId: item.variant.id,
        colorId: item.color.id,
        unitPrice: item.variant.price,
      })),
    };
  }
  if (delivery.currency !== "RUB") throw new Error("Для оплаты заказа требуется расчёт в рублях.");
  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        userId: input.userId,
        checkoutKey: input.checkoutKey,
        customerName: input.customerName.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        deliveryMethod: delivery.method,
        deliveryPaymentMode: input.deliveryPaymentMode,
        deliveryCityName: input.delivery.cityName.trim(),
        deliveryAddress: input.delivery.deliveryAddress?.trim() || null,
        cdekCityCode: input.delivery.cityCode,
        cdekPointCode: delivery.pickupPoint?.code ?? null,
        cdekPointAddress: delivery.pickupPoint?.address ?? null,
        cdekTariffCode: delivery.tariffCode,
        cdekTariffName: delivery.tariffName,
        deliveryCost: delivery.cost,
        deliveryCurrency: delivery.currency,
        deliveryPeriodMin: delivery.periodMin,
        deliveryPeriodMax: delivery.periodMax,
        deliveryCalculatedAt: new Date(),
        deliveryQuoteIsTest: delivery.isTest,
        comment: input.comment?.trim() || null,
        total,
        grandTotal: total + delivery.cost,
        payNowTotal: total + (input.deliveryPaymentMode === "prepaid" ? delivery.cost : 0),
      })
      .onConflictDoNothing({ target: [orders.userId, orders.checkoutKey] })
      .returning({ id: orders.id, number: orders.number });
    if (!order) {
      const [winner] = await tx
        .select({ id: orders.id, number: orders.number })
        .from(orders)
        .where(and(eq(orders.userId, input.userId), eq(orders.checkoutKey, input.checkoutKey)))
        .limit(1);
      if (!winner) throw new Error("Не удалось восстановить заказ. Повторите попытку.");
      return { kind: "created" as const, order: winner };
    }
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
          package: {
            lengthCm: item.variant.packageLengthCm,
            widthCm: item.variant.packageWidthCm,
            heightCm: item.variant.packageHeightCm,
            weightGrams: item.variant.packageWeightGrams,
          },
        },
      })),
    );
    await tx.insert(orderPayments).values([
      {
        orderId: order.id,
        component: "product",
        amount: total,
        currency: delivery.currency,
        status: "pending",
        provider: "mock",
      },
      {
        orderId: order.id,
        component: "delivery",
        amount: delivery.cost,
        currency: delivery.currency,
        status: input.deliveryPaymentMode === "prepaid" ? "pending" : "awaiting_receipt",
        provider: input.deliveryPaymentMode === "prepaid" ? "mock" : "cdek_manual",
      },
    ]);
    return { kind: "created" as const, order };
  });
}

export async function mockPayOrder(userId: string, orderId: string) {
  const db = getDb();
  const [order] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  if (!order) throw new Error("Заказ не найден.");
  if (order.status === "cancelled") throw new Error("Отменённый заказ оплатить нельзя.");
  await db
    .update(orderPayments)
    .set({ status: "mock_paid", paidAt: new Date(), updatedAt: new Date() })
    .where(and(eq(orderPayments.orderId, orderId), eq(orderPayments.status, "pending")));
  return getOrderDetails(userId, orderId);
}

export async function getOrderDetails(userId: string, orderId: string) {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  if (!order) throw new Error("Заказ не найден.");
  const [items, payments] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db.select().from(orderPayments).where(eq(orderPayments.orderId, orderId)),
  ]);
  return { ...order, items: items.map(({ snapshot: _snapshot, ...item }) => item), payments };
}
