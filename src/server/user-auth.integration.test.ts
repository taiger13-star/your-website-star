import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";

const state = vi.hoisted(() => ({ cookie: "", mail: [] as string[] }));

vi.mock("@tanstack/react-start/server", () => ({
  getRequestIP: () => "integration-test",
  getCookie: () => state.cookie || undefined,
  setCookie: (_name: string, value: string) => {
    state.cookie = value;
  },
  deleteCookie: () => {
    state.cookie = "";
  },
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: async (mail: { text: string }) => {
        state.mail.push(mail.text);
      },
    }),
  },
}));

import { getDb, closeDb } from "./db";
import { authRateLimits, orders, products, userTokens, users } from "./schema";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  verifyEmailCode,
} from "./user-auth";
import {
  getAccountOrders,
  getAdminUsers,
  getWishlist,
  mergeWishlist,
  setWishlistItem,
} from "./user-service";

const db = process.env["RUN_DB_TESTS"] === "1" ? describe : describe.skip;
const createdEmails: string[] = [];

function lastToken() {
  const match = state.mail.at(-1)?.match(/[?&]token=([^\s]+)/);
  if (!match) throw new Error("No email token captured");
  return decodeURIComponent(match[1]!);
}

db("customer accounts (local PostgreSQL)", () => {
  beforeAll(() => {
    process.env["AUTH_EMAIL_MODE"] = "smtp";
    process.env["PUBLIC_SITE_URL"] = "http://localhost:8080";
    process.env["SMTP_HOST"] = "test";
    process.env["SMTP_USER"] = "test";
    process.env["SMTP_PASSWORD"] = "test";
    process.env["SMTP_FROM"] = "test@example.test";
  });
  afterAll(async () => {
    for (const email of createdEmails) {
      await getDb().delete(users).where(eq(users.email, email));
    }
    const kinds = ["register", "verify", "verify-code", "login", "reset"];
    const keys = kinds.flatMap((kind) => [
      createHash("sha256").update(`${kind}:ip:integration-test`).digest("hex"),
      ...createdEmails.map((email) =>
        createHash("sha256").update(`${kind}:email:${email}`).digest("hex"),
      ),
    ]);
    await getDb().delete(authRateLimits).where(inArray(authRateLimits.key, keys));
    await closeDb();
  });

  it("requires verification, consumes tokens once, resets password and revokes sessions", async () => {
    const email = `test-${randomUUID()}@example.test`;
    createdEmails.push(email);
    const password = "first-password-123";
    expect(
      (
        await registerUser({
          name: "Тест",
          gender: null,
          email,
          password,
          confirmPassword: password,
        })
      ).emailSent,
    ).toBe(true);
    await expect(
      registerUser({ name: "Тест", gender: null, email, password, confirmPassword: password }),
    ).rejects.toThrow("уже существует");
    await expect(loginUser(email, password)).rejects.toThrow("подтвердите");
    const verifyToken = lastToken();
    await verifyEmail(verifyToken);
    await expect(verifyEmail(verifyToken)).rejects.toThrow("недействительна");
    const user = await loginUser(email, password);
    expect((await getCurrentUser())?.id).toBe(user.id);
    await requestPasswordReset(email);
    const resetToken = lastToken();
    await resetPassword(resetToken, "second-password-123", "second-password-123");
    expect(await getCurrentUser()).toBeNull();
    await expect(
      resetPassword(resetToken, "third-password-123", "third-password-123"),
    ).rejects.toThrow("недействительна");
    await expect(loginUser(email, password)).rejects.toThrow("Неверная");
    await loginUser(email, "second-password-123");
    await logoutUser();
    expect(await getCurrentUser()).toBeNull();
  });

  it("lists pending users and keeps guest orders outside account history", async () => {
    const email = `test-${randomUUID()}@example.test`;
    createdEmails.push(email);
    await registerUser({
      name: "Новый",
      gender: "female",
      email,
      password: "test-password-123",
      confirmPassword: "test-password-123",
    });
    const [user] = await getDb().select().from(users).where(eq(users.email, email));
    expect(user?.emailVerifiedAt).toBeNull();
    const list = await getAdminUsers(email, 1);
    expect(list.rows.some((row) => row.id === user!.id && row.emailVerifiedAt === null)).toBe(true);
    const [guestOrder] = await getDb()
      .insert(orders)
      .values({
        customerName: "Новый",
        phone: "+70000000000",
        email,
        deliveryMethod: "cdek_pvz",
        total: 100,
      })
      .returning();
    try {
      expect(await getAccountOrders(user!.id)).toEqual([]);
      const [linkedOrder] = await getDb()
        .insert(orders)
        .values({
          userId: user!.id,
          customerName: "Новый",
          phone: "+70000000000",
          email,
          deliveryMethod: "cdek_pvz",
          total: 100,
        })
        .returning();
      try {
        expect((await getAccountOrders(user!.id)).map((order) => order.id)).toEqual([
          linkedOrder!.id,
        ]);
        const [product] = await getDb().select({ id: products.id }).from(products).limit(1);
        if (!product) throw new Error("Seeded catalog is required for this integration test.");
        expect(await mergeWishlist(user!.id, [product.id, product.id])).toEqual([product.id]);
        const otherEmail = `test-${randomUUID()}@example.test`;
        createdEmails.push(otherEmail);
        await registerUser({
          name: "Другой",
          gender: null,
          email: otherEmail,
          password: "test-password-123",
          confirmPassword: "test-password-123",
        });
        const [other] = await getDb().select().from(users).where(eq(users.email, otherEmail));
        expect(await getWishlist(other!.id)).toEqual([]);
        expect(await getAccountOrders(other!.id)).toEqual([]);
        await setWishlistItem(user!.id, product.id, false);
        expect(await getWishlist(user!.id)).toEqual([]);
      } finally {
        await getDb().delete(orders).where(eq(orders.id, linkedOrder!.id));
      }
    } finally {
      await getDb().delete(orders).where(eq(orders.id, guestOrder!.id));
    }
  });

  it("rejects an expired verification link and accepts a newly sent one", async () => {
    const email = `test-${randomUUID()}@example.test`;
    createdEmails.push(email);
    await registerUser({
      name: "Тест",
      gender: null,
      email,
      password: "test-password-123",
      confirmPassword: "test-password-123",
    });
    const expiredToken = lastToken();
    await getDb()
      .update(userTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(userTokens.tokenHash, createHash("sha256").update(expiredToken).digest("hex")));
    await expect(verifyEmail(expiredToken)).rejects.toThrow("недействительна");
    await resendVerification(email);
    await verifyEmail(lastToken());
    const [user] = await getDb().select().from(users).where(eq(users.email, email));
    expect(user?.emailVerifiedAt).not.toBeNull();
  });

  it("uses one-time 0000 in stub mode without sending mail", async () => {
    process.env["AUTH_EMAIL_MODE"] = "stub";
    try {
      const email = `test-${randomUUID()}@example.test`;
      createdEmails.push(email);
      const mailCount = state.mail.length;
      const result = await registerUser({
        name: "Тест",
        gender: null,
        email,
        password: "test-password-123",
        confirmPassword: "test-password-123",
      });
      expect(result).toMatchObject({
        verificationMode: "stub",
        verificationReady: true,
        emailSent: false,
      });
      expect(state.mail).toHaveLength(mailCount);
      await expect(loginUser(email, "test-password-123")).rejects.toThrow("подтвердите");
      await expect(verifyEmailCode(email, "1111")).rejects.toThrow("Неверный");
      await verifyEmailCode(email, "0000");
      await expect(verifyEmailCode(email, "0000")).rejects.toThrow("Неверный");
      await loginUser(email, "test-password-123");
      await logoutUser();
      await expect(requestPasswordReset(email)).rejects.toThrow("недоступно");
    } finally {
      process.env["AUTH_EMAIL_MODE"] = "smtp";
    }
  });

  it("does not create an account when SMTP is not configured", async () => {
    const email = `test-${randomUUID()}@example.test`;
    const smtpHost = process.env["SMTP_HOST"];
    delete process.env["SMTP_HOST"];
    try {
      await expect(
        registerUser({
          name: "Тест",
          gender: null,
          email,
          password: "test-password-123",
          confirmPassword: "test-password-123",
        }),
      ).rejects.toThrow("отправка писем не настроена");
      const [user] = await getDb()
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email));
      expect(user).toBeUndefined();
    } finally {
      if (smtpHost === undefined) delete process.env["SMTP_HOST"];
      else process.env["SMTP_HOST"] = smtpHost;
    }
  });
});
