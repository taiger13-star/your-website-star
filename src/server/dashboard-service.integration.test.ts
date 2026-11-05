import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray, sql } from "drizzle-orm";
import { closeDb, getDb } from "./db";
import { loadDashboard } from "./dashboard-service";
import { recordVisit } from "./visit-store";
import { orderItems, orderPayments, orders, products, siteSessions, sitePageViews } from "./schema";

const enabled = process.env["RUN_DB_TESTS"] === "1";
const suite = enabled ? describe : describe.skip;
suite("admin dashboard — isolated PostgreSQL", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  const productId = randomUUID(),
    visitorId = randomUUID(),
    sessionId = randomUUID();
  const ids: string[] = [];
  let safeDatabase = false;
  const name = `Dashboard fixture ${randomUUID()}`;
  const event = {
    eventId: randomUUID(),
    visitorId,
    sessionId,
    path: "/catalog",
    kind: "view" as const,
    device: "mobile" as const,
    referrerHost: "yandex.ru",
  };

  beforeAll(async () => {
    if (
      !/^postgres(?:ql)?:\/\/[^/]*@(127\.0\.0\.1|localhost):\d+\/noir_dashboard(?:\?|$)/.test(
        process.env["DATABASE_URL"] || "",
      )
    )
      throw Error("Dashboard SQL tests require the dedicated local noir_dashboard database");
    safeDatabase = true;
    const db = getDb();
    await db.insert(products).values({
      id: productId,
      slug: `dashboard-${productId}`,
      sku: productId,
      name,
      category: "test",
      shortDescription: "fixture",
      description: "fixture",
      publicationStatus: "published",
    });
    const cases = [
      { total: 6000 },
      { total: 3000, old: true },
      { total: 9000, status: "mock_paid", provider: "mock" },
      { total: 7000, cancelled: true },
      { total: 5000, status: "pending", noDate: true },
      { total: 4000, amount: 3900 },
      { total: 8000, currency: "USD" },
      { total: 1100, noDate: true },
      { total: 1200, provider: "yookassa_test" },
      { total: 1300, provider: null },
      { total: 2000, oldPayment: true, old: true },
    ];
    for (const item of cases) {
      const id = randomUUID();
      ids.push(id);
      await db.insert(orders).values({
        id,
        total: item.total,
        status: item.cancelled ? "cancelled" : "new",
        customerName: "SQL fixture",
        phone: "test",
        deliveryMethod: "test",
        createdAt: new Date(now.getTime() - (item.old ? 45 : 0) * 86400000),
      });
      await db.insert(orderPayments).values({
        orderId: id,
        component: "product",
        amount: item.amount ?? item.total,
        currency: item.currency ?? "RUB",
        status: (item.status ?? "paid") as "paid" | "mock_paid" | "pending",
        provider: item.provider === undefined ? "yookassa" : item.provider,
        paidAt: item.noDate
          ? null
          : new Date(now.getTime() - (item.oldPayment ? 45 : 0) * 86400000),
      });
      await db.insert(orderItems).values({
        orderId: id,
        productId,
        productName: name,
        sku: productId,
        sizeCode: "M",
        system: "standard",
        colorName: "Тест",
        unitPrice: item.total,
        quantity: 1,
        snapshot: { fixture: true },
      });
    }
    await db.insert(orderPayments).values({
      orderId: ids[0]!,
      component: "delivery",
      amount: 500,
      currency: "RUB",
      status: "paid",
      provider: "cdek_manual",
      paidAt: now,
    });
  });
  afterAll(async () => {
    if (!safeDatabase) return;
    const db = getDb();
    if (ids.length) await db.delete(orders).where(inArray(orders.id, ids));
    await db.delete(products).where(eq(products.id, productId));
    await db.delete(siteSessions).where(eq(siteSessions.id, sessionId));
    await closeDb();
  });
  it("counts paid product amounts by payment date; excludes mock, test, delivery, USD, cancelled and inconsistent facts", async () => {
    const report = await loadDashboard(30, now);
    expect(report.commerce.revenue).toBe(9000);
    expect(report.commerce.paidOrders).toBe(2);
    expect(report.commerce.averageOrder).toBe(4500);
    expect(report.commerce.orders).toBe(9);
    expect(report.commerce.mockPayments).toBe(1);
    expect(report.statuses.map((s) => s.label)).toEqual(["new", "cancelled"]);
    expect(report.topProducts).toContainEqual({ name, quantity: 2, revenue: 9000 });
    expect(report.series.reduce((n, d) => n + d.revenue, 0)).toBe(9000);
    expect(report.series).toHaveLength(30);
    expect(report.recentOrders).toHaveLength(5);
    expect(JSON.stringify(report)).not.toMatch(/customerName|passwordHash|"phone"|"email"/);
  });
  it("deduplicates retried views and updates online presence without adding heartbeat views", async () => {
    expect(await recordVisit(event, now)).toEqual({ collected: true, duplicate: false });
    expect(await recordVisit(event, now)).toEqual({ collected: true, duplicate: true });
    expect(await recordVisit({ ...event, eventId: randomUUID(), kind: "heartbeat" }, now)).toEqual({
      collected: true,
      duplicate: false,
    });
    const report = await loadDashboard(1, now);
    expect(report.traffic).toMatchObject({ visitors: 1, views: 1, sessions: 1, online: 1 });
    expect(report.traffic?.devices).toEqual([{ label: "mobile", count: 1 }]);
    expect(report.traffic?.sources).toEqual([{ label: "yandex.ru", count: 1 }]);
    const later = await loadDashboard(1, new Date(now.getTime() + 91000));
    expect(later.traffic?.online).toBe(0);
  });
  it("cannot create online presence through unknown heartbeats or attach another visitor to an existing session", async () => {
    expect(
      (
        await recordVisit(
          { ...event, eventId: randomUUID(), sessionId: randomUUID(), kind: "heartbeat" },
          now,
        )
      ).collected,
    ).toBe(false);
    expect(
      (await recordVisit({ ...event, eventId: randomUUID(), visitorId: randomUUID() }, now))
        .collected,
    ).toBe(false);
    const rows = await getDb()
      .select()
      .from(sitePageViews)
      .where(eq(sitePageViews.visitorId, visitorId));
    expect(rows).toHaveLength(1);
  });
  it("keeps a missing traffic migration distinguishable from a measured zero", async () => {
    const db = getDb();
    await db.execute(sql`ALTER TABLE site_page_views RENAME TO site_page_views_qa`);
    try {
      const report = await loadDashboard(1, now);
      expect(report.traffic).toBeNull();
      expect(report.trafficAvailable).toBe(false);
      expect(report.commerce.revenue).toBe(9000);
    } finally {
      await db.execute(sql`ALTER TABLE site_page_views_qa RENAME TO site_page_views`);
    }
  });
});
