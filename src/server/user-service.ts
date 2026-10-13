import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { getDb } from "./db";
import { orderItems, orderPayments, orders, products, userWishlist, users } from "./schema";
import { removeObject, uploadPublicObject } from "./storage";

export async function updateProfile(userId: string, name: string) {
  const [user] = await getDb()
    .update(users)
    .set({ name: name.trim(), updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl });
  return user!;
}

function imageType(bytes: Uint8Array) {
  if (
    bytes.length >= 8 &&
    bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index])
  )
    return "image/png";
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

export async function uploadAvatar(userId: string, file: File) {
  if (file.size === 0 || file.size > 2 * 1024 * 1024)
    throw new Error("Аватар должен быть не больше 2 МБ.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type || type !== file.type) throw new Error("Поддерживаются PNG, JPEG и WebP.");
  const extension = type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : "webp";
  const uploaded = await uploadPublicObject({
    body: bytes,
    fileName: `avatar.${extension}`,
    contentType: type,
  });
  const db = getDb();
  try {
    const [previous] = await db
      .select({ objectKey: users.avatarObjectKey })
      .from(users)
      .where(eq(users.id, userId));
    const [user] = await db
      .update(users)
      .set({
        avatarObjectKey: uploaded.objectKey,
        avatarUrl: uploaded.publicUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ avatarUrl: users.avatarUrl });
    if (previous?.objectKey) await removeObject(previous.objectKey).catch(() => undefined);
    return user!;
  } catch (error) {
    await removeObject(uploaded.objectKey).catch(() => undefined);
    throw error;
  }
}

export async function getWishlist(userId: string) {
  const rows = await getDb()
    .select({ productId: userWishlist.productId })
    .from(userWishlist)
    .where(eq(userWishlist.userId, userId))
    .orderBy(desc(userWishlist.createdAt));
  return rows.map((row) => row.productId);
}

export async function mergeWishlist(userId: string, ids: string[]) {
  const unique = [...new Set(ids)].slice(0, 200);
  if (unique.length) {
    const valid = await getDb()
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, unique));
    if (valid.length)
      await getDb()
        .insert(userWishlist)
        .values(valid.map(({ id }) => ({ userId, productId: id })))
        .onConflictDoNothing();
  }
  return getWishlist(userId);
}

export async function setWishlistItem(userId: string, productId: string, saved: boolean) {
  const db = getDb();
  if (saved) {
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (!product) throw new Error("Товар не найден.");
    await db.insert(userWishlist).values({ userId, productId }).onConflictDoNothing();
  } else {
    await db
      .delete(userWishlist)
      .where(and(eq(userWishlist.userId, userId), eq(userWishlist.productId, productId)));
  }
  return { ok: true };
}

export async function getAccountOrders(userId: string) {
  const orderRows = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
  const ids = orderRows.map((order) => order.id);
  const [items, payments] = ids.length
    ? await Promise.all([
        getDb().select().from(orderItems).where(inArray(orderItems.orderId, ids)),
        getDb().select().from(orderPayments).where(inArray(orderPayments.orderId, ids)),
      ])
    : [[], []];
  return orderRows.map((order) => ({
    ...order,
    items: items
      .filter((item) => item.orderId === order.id)
      .map(({ snapshot: _snapshot, ...item }) => item),
    payments: payments.filter((payment) => payment.orderId === order.id),
  }));
}

export async function getAdminUsers(query: string, page: number) {
  const db = getDb();
  const size = 20;
  const search = query.trim();
  const escaped = search.replace(/[\\%_]/g, "\\$&");
  const condition = search
    ? or(ilike(users.email, `%${escaped}%`), ilike(users.name, `%${escaped}%`))
    : undefined;
  const [totalRow] = await db.select({ total: count() }).from(users).where(condition);
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      gender: users.gender,
      email: users.email,
      avatarUrl: users.avatarUrl,
      emailVerifiedAt: users.emailVerifiedAt,
      createdAt: users.createdAt,
      orderCount: sql<number>`count(${orders.id})::int`,
    })
    .from(users)
    .leftJoin(orders, eq(orders.userId, users.id))
    .where(condition)
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .limit(size)
    .offset((page - 1) * size);
  return { rows, total: totalRow?.total ?? 0, page, pageSize: size };
}
