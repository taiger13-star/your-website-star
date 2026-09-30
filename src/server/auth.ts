import { createHmac, timingSafeEqual } from "node:crypto";

import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

const COOKIE_NAME = "noir_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret() {
  const value = process.env["SESSION_SECRET"];
  if (!value || value.length < 24)
    throw new Error("SESSION_SECRET must contain at least 24 characters.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isValidAdminRoute(token: string) {
  const expected = process.env["ADMIN_ROUTE_TOKEN"];
  return Boolean(expected && /^[A-Za-z]{32}$/.test(expected) && safeEqual(token, expected));
}

export function verifyAdminPassword(password: string) {
  const expected = process.env["ADMIN_PASSWORD"];
  return Boolean(expected && safeEqual(password, expected));
}

export function startAdminSession() {
  const payload = Buffer.from(
    JSON.stringify({ role: "admin", exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS }),
  ).toString("base64url");
  setCookie(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function endAdminSession() {
  deleteCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", path: "/" });
}

export function requireAdmin() {
  const token = getCookie(COOKIE_NAME);
  if (!token) throw new Error("UNAUTHORIZED");
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload)))
    throw new Error("UNAUTHORIZED");
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
      role?: string;
    };
    if (data.role !== "admin" || !data.exp || data.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error("UNAUTHORIZED");
    }
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}
