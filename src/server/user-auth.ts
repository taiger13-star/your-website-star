import { createHash, randomBytes } from "node:crypto";
import { Algorithm, hash, verify } from "@node-rs/argon2";
import { and, eq, gt, sql } from "drizzle-orm";
import { deleteCookie, getCookie, getRequestIP, setCookie } from "@tanstack/react-start/server";
import nodemailer from "nodemailer";

import { getDb } from "./db";
import { authRateLimits, userSessions, userTokens, users } from "./schema";

const COOKIE = "noir_user";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
type TokenPurpose = "verify" | "reset";

export function getAuthEmailMode(): "smtp" | "stub" {
  return process.env["AUTH_EMAIL_MODE"] === "stub" ? "stub" : "smtp";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function randomToken() {
  return randomBytes(32).toString("base64url");
}

function publicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    emailVerifiedAt: user.emailVerifiedAt,
  };
}

async function limit(kind: string, identity: string, max: number, minutes: number) {
  const key = digest(`${kind}:${identity}`);
  const cutoff = new Date(Date.now() - minutes * 60_000).toISOString();
  const [row] = await getDb()
    .insert(authRateLimits)
    .values({ key, attempts: 1, windowStartedAt: new Date() })
    .onConflictDoUpdate({
      target: authRateLimits.key,
      set: {
        attempts: sql`case when ${authRateLimits.windowStartedAt} < ${cutoff} then 1 else ${authRateLimits.attempts} + 1 end`,
        windowStartedAt: sql`case when ${authRateLimits.windowStartedAt} < ${cutoff} then now() else ${authRateLimits.windowStartedAt} end`,
      },
    })
    .returning({ attempts: authRateLimits.attempts });
  if (row && row.attempts > max) throw new Error("Слишком много попыток. Попробуйте позже.");
}

async function limitEmailAction(kind: string, email: string, max: number) {
  const ip = getRequestIP();
  if (ip) await limit(`${kind}:ip`, ip, 30, 15);
  await limit(`${kind}:email`, email, max, 15);
}

function siteUrl() {
  const value = process.env["PUBLIC_SITE_URL"];
  if (!value) throw new Error("PUBLIC_SITE_URL is required for account emails.");
  const url = new URL(value);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("PUBLIC_SITE_URL must use HTTPS.");
  }
  return url.origin;
}

async function sendTokenEmail(email: string, purpose: TokenPurpose, token: string) {
  const host = process.env["SMTP_HOST"];
  const user = process.env["SMTP_USER"];
  const password = process.env["SMTP_PASSWORD"];
  const from = process.env["SMTP_FROM"];
  if (!host || !user || !password || !from) throw new Error("SMTP is not configured.");
  const url = `${siteUrl()}/${purpose === "verify" ? "verify-email" : "reset-password"}?token=${encodeURIComponent(token)}`;
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env["SMTP_PORT"] ?? "587"),
    secure: process.env["SMTP_SECURE"] === "true",
    auth: { user, pass: password },
  });
  await transport.sendMail({
    from,
    to: email,
    subject:
      purpose === "verify" ? "Подтвердите почту — NOIR ATELIER" : "Сброс пароля — NOIR ATELIER",
    text: `${purpose === "verify" ? "Подтвердите почту" : "Задайте новый пароль"}: ${url}\n\nЕсли вы не запрашивали это письмо, просто проигнорируйте его.`,
  });
}

async function issueToken(userId: string, email: string, purpose: TokenPurpose) {
  const stubVerification = purpose === "verify" && getAuthEmailMode() === "stub";
  const token = stubVerification ? "0000" : randomToken();
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .delete(userTokens)
      .where(and(eq(userTokens.userId, userId), eq(userTokens.purpose, purpose)));
    await tx.insert(userTokens).values({
      userId,
      purpose,
      tokenHash: digest(stubVerification ? `verify:${userId}:${token}` : token),
      expiresAt: new Date(Date.now() + (purpose === "verify" ? 24 : 1) * 60 * 60_000),
    });
  });
  if (!stubVerification) await sendTokenEmail(email, purpose, token);
}

export async function registerUser(input: {
  name: string;
  gender: "male" | "female" | null;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  if (input.password !== input.confirmPassword) throw new Error("Пароли не совпадают.");
  const email = normalizeEmail(input.email);
  await limitEmailAction("register", email, 5);
  const passwordHash = await hash(input.password, { algorithm: Algorithm.Argon2id });
  let user: typeof users.$inferSelect | undefined;
  try {
    [user] = await getDb()
      .insert(users)
      .values({
        name: input.name.trim(),
        gender: input.gender,
        email,
        passwordHash,
      })
      .returning();
  } catch (error) {
    const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
    if (cause && typeof cause === "object" && "code" in cause && cause.code === "23505") {
      throw new Error("Аккаунт с этой почтой уже существует.");
    }
    throw error;
  }
  if (!user) throw new Error("Не удалось создать аккаунт.");
  const verificationMode = getAuthEmailMode();
  try {
    await issueToken(user.id, email, "verify");
    return { emailSent: verificationMode === "smtp", verificationMode, verificationReady: true };
  } catch {
    return { emailSent: false, verificationMode, verificationReady: false };
  }
}

export async function resendVerification(emailInput: string) {
  const email = normalizeEmail(emailInput);
  await limitEmailAction("verify", email, 3);
  const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
  if (user && !user.emailVerifiedAt) await issueToken(user.id, email, "verify");
  return { ok: true };
}

export async function verifyEmail(token: string) {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .delete(userTokens)
      .where(
        and(
          eq(userTokens.tokenHash, digest(token)),
          eq(userTokens.purpose, "verify"),
          gt(userTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: userTokens.userId });
    if (!row) return false;
    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, row.userId));
    return true;
  });
  if (!result) throw new Error("Ссылка недействительна или срок её действия истёк.");
  return { ok: true };
}

export async function verifyEmailCode(emailInput: string, code: string) {
  if (getAuthEmailMode() !== "stub") throw new Error("Подтверждение кодом недоступно.");
  const email = normalizeEmail(emailInput);
  await limitEmailAction("verify-code", email, 5);
  const db = getDb();
  const [user] = await db
    .select({ id: users.id, verifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user || user.verifiedAt || code !== "0000")
    throw new Error("Неверный или просроченный код.");
  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .delete(userTokens)
      .where(
        and(
          eq(userTokens.tokenHash, digest(`verify:${user.id}:${code}`)),
          eq(userTokens.purpose, "verify"),
          gt(userTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: userTokens.userId });
    if (!row) return false;
    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, row.userId));
    return true;
  });
  if (!result) throw new Error("Неверный или просроченный код.");
  return { ok: true };
}

export async function loginUser(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  await limitEmailAction("login", email, 8);
  const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verify(user.passwordHash, password)))
    throw new Error("Неверная почта или пароль.");
  if (!user.emailVerifiedAt) throw new Error("Сначала подтвердите почту.");
  const token = randomToken();
  await getDb()
    .insert(userSessions)
    .values({
      tokenHash: digest(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
    });
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return publicUser(user);
}

export async function getCurrentUser() {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const [row] = await getDb()
    .select({ user: users })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(and(eq(userSessions.tokenHash, digest(token)), gt(userSessions.expiresAt, new Date())))
    .limit(1);
  return row?.user.emailVerifiedAt ? publicUser(row.user) : null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Требуется вход в аккаунт.");
  return user;
}

export async function logoutUser() {
  const token = getCookie(COOKIE);
  if (token)
    await getDb()
      .delete(userSessions)
      .where(eq(userSessions.tokenHash, digest(token)));
  deleteCookie(COOKIE, { httpOnly: true, sameSite: "lax", path: "/" });
  return { ok: true };
}

export async function requestPasswordReset(emailInput: string) {
  if (getAuthEmailMode() === "stub") {
    throw new Error("Восстановление пароля временно недоступно без почты.");
  }
  const email = normalizeEmail(emailInput);
  await limitEmailAction("reset", email, 3);
  const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
  if (user && user.emailVerifiedAt) await issueToken(user.id, email, "reset");
  return { ok: true };
}

export async function resetPassword(token: string, password: string, confirmPassword: string) {
  if (password !== confirmPassword) throw new Error("Пароли не совпадают.");
  const passwordHash = await hash(password, { algorithm: Algorithm.Argon2id });
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .delete(userTokens)
      .where(
        and(
          eq(userTokens.tokenHash, digest(token)),
          eq(userTokens.purpose, "reset"),
          gt(userTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: userTokens.userId });
    if (!row) return false;
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, row.userId));
    await tx.delete(userSessions).where(eq(userSessions.userId, row.userId));
    return true;
  });
  if (!result) throw new Error("Ссылка недействительна или срок её действия истёк.");
  return { ok: true };
}
