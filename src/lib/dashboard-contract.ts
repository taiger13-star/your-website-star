import { z } from "zod";

export type DashboardDays = 1 | 7 | 30 | 90;
export const dashboardPeriod = z
  .object({ days: z.union([z.literal(1), z.literal(7), z.literal(30), z.literal(90)]) })
  .strict();
const PUBLIC = new Set([
  "/",
  "/catalog",
  "/collections",
  "/about",
  "/contacts",
  "/delivery",
  "/returns",
  "/smart",
  "/business",
  "/3d-design",
  "/3d-printing",
  "/configurator",
  "/privacy",
  "/terms",
  "/data",
]);

export function publicVisitPath(value: string): string | null {
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  const path = value.split(/[?#]/, 1)[0]?.replace(/\/$/, "") || "/";
  if (PUBLIC.has(path)) return path;
  return /^\/(product|collections)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path) ? path : null;
}

export const visitSchema = z
  .object({
    eventId: z.string().uuid(),
    visitorId: z.string().uuid(),
    sessionId: z.string().uuid(),
    path: z.string().max(200).transform(publicVisitPath).pipe(z.string()),
    kind: z.enum(["view", "heartbeat"]),
    device: z.enum(["desktop", "tablet", "mobile"]),
    referrerHost: z
      .string()
      .max(120)
      .regex(/^(?:[a-z0-9.-]+)?$/),
  })
  .strict();
export type VisitEvent = z.infer<typeof visitSchema>;

export function reportingWindow(days: DashboardDays, now = new Date()) {
  dashboardPeriod.parse({ days });
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Moscow" }).format(now);
  const from = new Date(new Date(`${today}T00:00:00+03:00`).getTime() - (days - 1) * 86400000);
  const dates = Array.from({ length: days }, (_, i) =>
    new Date(from.getTime() + i * 86400000 + 3 * 3600000).toISOString().slice(0, 10),
  );
  return { from, to: now, dates };
}

export function csvCell(value: string | number) {
  const text = String(value);
  return `"${(/^\s*[=+\-@]|^[\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
}

export type DayPoint = {
  date: string;
  visitors: number;
  views: number;
  orders: number;
  revenue: number;
};
export type TrafficReport = {
  visitors: number;
  views: number;
  sessions: number;
  online: number;
  firstMeasurement: string | null;
  devices: { label: string; count: number }[];
  sources: { label: string; count: number }[];
  paths: { label: string; count: number }[];
};
export type DashboardReport = {
  days: DashboardDays;
  generatedAt: string;
  testEnvironment: boolean;
  commerce: {
    orders: number;
    activeOrders: number;
    paidOrders: number;
    revenue: number;
    averageOrder: number | null;
    mockPayments: number;
  };
  catalog: {
    published: number;
    draft: number;
    hidden: number;
    missingImages: number;
    unavailable: number;
  };
  customers: { total: number; new: number; verified: number };
  inquiries: { projects: number; printing: number; newPrinting: number };
  traffic: TrafficReport | null;
  trafficAvailable: boolean;
  series: DayPoint[];
  statuses: { label: string; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    number: number;
    status: string;
    total: number;
    createdAt: string;
    paymentStatus: string | null;
  }[];
};
