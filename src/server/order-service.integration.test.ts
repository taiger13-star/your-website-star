import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

import { closeDb, getDb } from "./db";
import { calculateCdekDelivery } from "./cdek-service";
import { confirmDeliveryReceipt, updateOrderDelivery } from "./admin-service";
import { createOrder, getOrderDetails, mockPayOrder } from "./order-service";
import { colors, orders, productColors, products, productVariants, sizes, users } from "./schema";

const databaseDescribe = process.env["RUN_DB_TESTS"] === "1" ? describe : describe.skip;

databaseDescribe("order checkout and mock payments (local PostgreSQL)", () => {
  const suffix = randomUUID();
  let userId: string;
  let otherUserId: string;
  let productId: string;
  let variantId: string;
  let colorId: string;
  let sizeCode: string;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    process.env["CDEK_MODE"] = "mock";
    const db = getDb();
    const [size] = await db.select({ code: sizes.code }).from(sizes).limit(1);
    const [color] = await db.select({ id: colors.id }).from(colors).limit(1);
    if (!size || !color) throw new Error("Seeded size and color are required.");
    sizeCode = size.code;
    colorId = color.id;
    const [user, other] = await db
      .insert(users)
      .values([
        {
          name: "Покупатель",
          email: `checkout-${suffix}@example.test`,
          passwordHash: "test",
          emailVerifiedAt: new Date(),
        },
        {
          name: "Другой",
          email: `checkout-other-${suffix}@example.test`,
          passwordHash: "test",
          emailVerifiedAt: new Date(),
        },
      ])
      .returning({ id: users.id });
    userId = user!.id;
    otherUserId = other!.id;
    const [product] = await db
      .insert(products)
      .values({
        slug: `checkout-${suffix}`,
        sku: `CHECKOUT-${suffix}`,
        category: "test",
        name: "Тестовый товар",
        shortDescription: "Тест",
        description: "Тест",
        publicationStatus: "published",
      })
      .returning({ id: products.id });
    productId = product!.id;
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sizeCode,
        price: 1800,
        packageLengthCm: 20,
        packageWidthCm: 20,
        packageHeightCm: 20,
        packageWeightGrams: 900,
      })
      .returning({ id: productVariants.id });
    variantId = variant!.id;
    await db.insert(productColors).values({ productId, colorId });
  });

  afterAll(async () => {
    const db = getDb();
    for (const id of createdOrderIds) await db.delete(orders).where(eq(orders.id, id));
    if (productId) await db.delete(products).where(eq(products.id, productId));
    if (userId) await db.delete(users).where(eq(users.id, userId));
    if (otherUserId) await db.delete(users).where(eq(users.id, otherUserId));
    await closeDb();
  });

  async function input(method: "cdek_pvz" | "cdek_courier", mode: "prepaid" | "on_receipt") {
    const delivery = {
      method,
      cityCode: 44,
      cityName: "Москва",
      ...(method === "cdek_pvz"
        ? { pickupPointCode: "TEST-44-1" }
        : { deliveryAddress: "Москва, Тестовая улица, 1" }),
    };
    const items = [{ productId, variantId, colorId, quantity: 2 }];
    const quote = await calculateCdekDelivery({
      ...delivery,
      items: items.map(({ productId, variantId, quantity }) => ({
        productId,
        variantId,
        quantity,
      })),
    });
    return {
      userId,
      checkoutKey: randomUUID(),
      customerName: "Покупатель",
      phone: "+79990000000",
      email: `checkout-${suffix}@example.test`,
      deliveryPaymentMode: mode,
      expectedSubtotal: 3600,
      expectedDeliveryCost: quote.cost,
      expectedTariffCode: quote.tariffCode,
      expectedCurrency: quote.currency,
      delivery,
      items,
    } as const;
  }

  for (const method of ["cdek_pvz", "cdek_courier"] as const) {
    for (const mode of ["prepaid", "on_receipt"] as const) {
      it(`${method}: ${mode} stores totals and payment statuses`, async () => {
        const request = await input(method, mode);
        const result = await createOrder(request);
        expect(result.kind).toBe("created");
        if (result.kind !== "created") return;
        createdOrderIds.push(result.order.id);
        const repeat = await createOrder(request);
        expect(repeat).toEqual(result);
        const before = await getOrderDetails(userId, result.order.id);
        expect(before.total).toBe(3600);
        expect(before.grandTotal).toBe(3600 + request.expectedDeliveryCost);
        expect(before.payNowTotal).toBe(
          3600 + (mode === "prepaid" ? request.expectedDeliveryCost : 0),
        );
        expect(before.items).toHaveLength(1);
        expect(before.payments.find((payment) => payment.component === "product")?.status).toBe(
          "pending",
        );
        expect(before.payments.find((payment) => payment.component === "delivery")?.status).toBe(
          mode === "prepaid" ? "pending" : "awaiting_receipt",
        );
        await expect(getOrderDetails(otherUserId, result.order.id)).rejects.toThrow("не найден");
        await expect(mockPayOrder(otherUserId, result.order.id)).rejects.toThrow("не найден");
        await mockPayOrder(userId, result.order.id);
        await mockPayOrder(userId, result.order.id);
        const paid = await getOrderDetails(userId, result.order.id);
        expect(paid.payments.find((payment) => payment.component === "product")?.status).toBe(
          "mock_paid",
        );
        expect(paid.payments.find((payment) => payment.component === "delivery")?.status).toBe(
          mode === "prepaid" ? "mock_paid" : "awaiting_receipt",
        );
        if (mode === "on_receipt") {
          await updateOrderDelivery(result.order.id, "TEST-TRACK-1");
          await confirmDeliveryReceipt(result.order.id);
          const delivered = await getOrderDetails(userId, result.order.id);
          expect(delivered.cdekTrackingNumber).toBe("TEST-TRACK-1");
          expect(
            delivered.payments.find((payment) => payment.component === "delivery")?.status,
          ).toBe("paid");
        }
      });
    }
  }

  it("returns revised server prices before creating an order", async () => {
    const request = await input("cdek_pvz", "prepaid");
    const result = await createOrder({ ...request, expectedSubtotal: 1 });
    expect(result.kind).toBe("changed");
    if (result.kind === "changed") expect(result.subtotal).toBe(3600);
    const [existing] = await getDb()
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.checkoutKey, request.checkoutKey)))
      .limit(1);
    expect(existing).toBeUndefined();
  });

  it("requires fresh confirmation when the displayed delivery quote changes", async () => {
    const request = await input("cdek_courier", "on_receipt");
    const result = await createOrder({
      ...request,
      expectedDeliveryCost: request.expectedDeliveryCost + 1,
    });
    expect(result.kind).toBe("changed");
    if (result.kind === "changed") expect(result.delivery.cost).toBe(request.expectedDeliveryCost);
  });

  it("allows a test checkout when a seeded product has no package data", async () => {
    const db = getDb();
    await db
      .update(productVariants)
      .set({
        packageLengthCm: null,
        packageWidthCm: null,
        packageHeightCm: null,
        packageWeightGrams: null,
      })
      .where(eq(productVariants.id, variantId));
    try {
      const request = await input("cdek_pvz", "prepaid");
      const result = await createOrder(request);
      expect(result.kind).toBe("created");
      if (result.kind !== "created") return;
      createdOrderIds.push(result.order.id);
      const order = await getOrderDetails(userId, result.order.id);
      expect(order.deliveryQuoteIsTest).toBe(true);
      await mockPayOrder(userId, result.order.id);
      const paid = await getOrderDetails(userId, result.order.id);
      expect(paid.payments.find((payment) => payment.component === "product")?.status).toBe(
        "mock_paid",
      );
    } finally {
      await db
        .update(productVariants)
        .set({
          packageLengthCm: 20,
          packageWidthCm: 20,
          packageHeightCm: 20,
          packageWeightGrams: 900,
        })
        .where(eq(productVariants.id, variantId));
    }
  });

  it("leaves legacy orders without a false paid status", async () => {
    const [legacy] = await getDb()
      .insert(orders)
      .values({
        userId,
        customerName: "Покупатель",
        phone: "+79990000000",
        deliveryMethod: "cdek_pvz",
        total: 100,
      })
      .returning({ id: orders.id });
    createdOrderIds.push(legacy!.id);
    const details = await getOrderDetails(userId, legacy!.id);
    expect(details.deliveryPaymentMode).toBeNull();
    expect(details.payments).toHaveLength(0);
  });
});
