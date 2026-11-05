import { sql, type SQL } from "drizzle-orm";
import {
  reportingWindow,
  type DashboardDays,
  type DashboardReport,
  type TrafficReport,
} from "../lib/dashboard-contract";
import { getDb } from "./db";

// Product amounts in this schema are RUB, not kopecks. Delivery is a separate component.
const REAL_PAYMENT = sql`p.component='product' AND p.status='paid' AND p.paid_at IS NOT NULL
  AND p.currency='RUB' AND p.amount>0 AND p.amount=o.total AND o.status<>'cancelled'
  AND p.provider IS NOT NULL AND p.provider<>'' AND lower(p.provider) NOT LIKE '%mock%'
  AND lower(p.provider) NOT LIKE '%test%'`;
type Row = Record<string, unknown>;
const STATUS_ORDER = ["new", "in_progress", "awaiting_customer", "ready", "completed", "cancelled"];
function n(row: Row | undefined, key: string) {
  const value = row?.[key];
  if (value === null || value === undefined || !Number.isFinite(Number(value)))
    throw Error("Invalid dashboard aggregate");
  return Number(value);
}
const missingTable = (error: unknown): boolean =>
  !!error &&
  typeof error === "object" &&
  (("code" in error && error.code === "42P01") || ("cause" in error && missingTable(error.cause)));

export async function loadDashboard(
  days: DashboardDays,
  now = new Date(),
): Promise<DashboardReport> {
  const range = reportingWindow(days, now);
  const from = range.from.toISOString(),
    to = now.toISOString();
  const db = getDb();
  const query = (q: SQL) => db.execute<Row>(q);
  const [
    commerce,
    catalog,
    customers,
    inquiries,
    statuses,
    dailyOrders,
    dailyRevenue,
    topProducts,
    recent,
  ] = await Promise.all([
    query(sql`SELECT
      (SELECT count(*) FROM orders WHERE created_at>=${from}::timestamptz AND created_at<=${to}::timestamptz) AS orders,
      (SELECT count(*) FROM orders WHERE status IN ('new','in_progress','awaiting_customer','ready')) AS active,
      count(*) AS paid, coalesce(sum(p.amount),0) AS revenue,
      (SELECT count(*) FROM order_payments WHERE component='product' AND status='mock_paid' AND paid_at>=${from}::timestamptz AND paid_at<=${to}::timestamptz) AS mock
      FROM order_payments p JOIN orders o ON o.id=p.order_id WHERE ${REAL_PAYMENT}
      AND p.paid_at>=${from}::timestamptz AND p.paid_at<=${to}::timestamptz`),
    query(sql`SELECT count(*) FILTER(WHERE publication_status='published') AS published,
      count(*) FILTER(WHERE publication_status='draft') AS draft, count(*) FILTER(WHERE publication_status='hidden') AS hidden,
      count(*) FILTER(WHERE publication_status='published' AND NOT EXISTS(SELECT 1 FROM product_images i WHERE i.product_id=products.id)) AS missing_images,
      count(*) FILTER(WHERE publication_status='published' AND NOT EXISTS(SELECT 1 FROM product_variants v WHERE v.product_id=products.id AND v.enabled)) AS unavailable FROM products`),
    query(sql`SELECT count(*) AS total, count(*) FILTER(WHERE email_verified_at IS NOT NULL) AS verified,
      count(*) FILTER(WHERE created_at>=${from}::timestamptz AND created_at<=${to}::timestamptz) AS new FROM users`),
    query(sql`SELECT (SELECT count(*) FROM project_inquiries WHERE created_at>=${from}::timestamptz AND created_at<=${to}::timestamptz) AS projects,
      (SELECT count(*) FROM custom_print_inquiries WHERE created_at>=${from}::timestamptz AND created_at<=${to}::timestamptz) AS printing,
      (SELECT count(*) FROM custom_print_inquiries WHERE status='new') AS new_printing`),
    query(
      sql`SELECT status AS label,count(*) AS count FROM orders WHERE created_at>=${from}::timestamptz AND created_at<=${to}::timestamptz GROUP BY status`,
    ),
    query(sql`SELECT to_char(created_at AT TIME ZONE 'Europe/Moscow','YYYY-MM-DD') AS date,count(*) AS count FROM orders
      WHERE created_at>=${from}::timestamptz AND created_at<=${to}::timestamptz GROUP BY 1`),
    query(sql`SELECT to_char(p.paid_at AT TIME ZONE 'Europe/Moscow','YYYY-MM-DD') AS date,sum(p.amount) AS amount
      FROM order_payments p JOIN orders o ON o.id=p.order_id WHERE ${REAL_PAYMENT}
      AND p.paid_at>=${from}::timestamptz AND p.paid_at<=${to}::timestamptz GROUP BY 1`),
    query(sql`SELECT i.product_name AS name,sum(i.quantity) AS quantity,sum(i.unit_price*i.quantity) AS revenue
      FROM order_items i JOIN orders o ON o.id=i.order_id JOIN order_payments p ON p.order_id=o.id
      WHERE ${REAL_PAYMENT} AND p.paid_at>=${from}::timestamptz AND p.paid_at<=${to}::timestamptz
      GROUP BY i.product_name ORDER BY revenue DESC,name LIMIT 5`),
    query(sql`SELECT o.number,o.status,o.total,o.created_at,p.status AS payment_status FROM orders o
      LEFT JOIN order_payments p ON p.order_id=o.id AND p.component='product'
      WHERE o.created_at>=${from}::timestamptz AND o.created_at<=${to}::timestamptz ORDER BY o.created_at DESC,o.number DESC LIMIT 5`),
  ]);
  let traffic: TrafficReport | null = null;
  let dailyTraffic: Row[] = [];
  try {
    const where = sql`viewed_at>=${from}::timestamptz AND viewed_at<=${to}::timestamptz`;
    const [counts, daily, devices, sources, paths] = await Promise.all([
      query(sql`SELECT count(*) AS views,count(DISTINCT visitor_id) AS visitors,count(DISTINCT session_id) AS sessions,
        (SELECT count(DISTINCT visitor_id) FROM site_sessions WHERE last_seen>=${new Date(now.getTime() - 90000).toISOString()}::timestamptz AND last_seen<=${to}::timestamptz) AS online,
        (SELECT min(viewed_at) FROM site_page_views) AS first FROM site_page_views WHERE ${where}`),
      query(
        sql`SELECT to_char(viewed_at AT TIME ZONE 'Europe/Moscow','YYYY-MM-DD') AS date,count(*) AS views,count(DISTINCT visitor_id) AS visitors FROM site_page_views WHERE ${where} GROUP BY 1`,
      ),
      query(
        sql`SELECT device AS label,count(*) AS count FROM site_page_views WHERE ${where} GROUP BY device ORDER BY count DESC`,
      ),
      query(
        sql`SELECT referrer_host AS label,count(*) AS count FROM site_page_views WHERE ${where} GROUP BY referrer_host ORDER BY count DESC,label LIMIT 5`,
      ),
      query(
        sql`SELECT path AS label,count(*) AS count FROM site_page_views WHERE ${where} GROUP BY path ORDER BY count DESC,label LIMIT 5`,
      ),
    ]);
    const list = (rows: Row[]) =>
      rows.map((row) => ({ label: String(row["label"]), count: n(row, "count") }));
    const first = counts[0]?.["first"];
    traffic = {
      visitors: n(counts[0], "visitors"),
      views: n(counts[0], "views"),
      sessions: n(counts[0], "sessions"),
      online: n(counts[0], "online"),
      firstMeasurement: first ? new Date(String(first)).toISOString() : null,
      devices: list(devices),
      sources: list(sources),
      paths: list(paths),
    };
    dailyTraffic = daily;
  } catch (error) {
    if (!missingTable(error)) throw error;
  }
  const paid = n(commerce[0], "paid"),
    revenue = n(commerce[0], "revenue");
  return {
    days,
    generatedAt: to,
    testEnvironment: process.env["DASHBOARD_ENVIRONMENT"] === "test",
    commerce: {
      orders: n(commerce[0], "orders"),
      activeOrders: n(commerce[0], "active"),
      paidOrders: paid,
      revenue,
      averageOrder: paid ? revenue / paid : null,
      mockPayments: n(commerce[0], "mock"),
    },
    catalog: {
      published: n(catalog[0], "published"),
      draft: n(catalog[0], "draft"),
      hidden: n(catalog[0], "hidden"),
      missingImages: n(catalog[0], "missing_images"),
      unavailable: n(catalog[0], "unavailable"),
    },
    customers: {
      total: n(customers[0], "total"),
      new: n(customers[0], "new"),
      verified: n(customers[0], "verified"),
    },
    inquiries: {
      projects: n(inquiries[0], "projects"),
      printing: n(inquiries[0], "printing"),
      newPrinting: n(inquiries[0], "new_printing"),
    },
    traffic,
    trafficAvailable: traffic !== null,
    series: range.dates.map((date) => {
      const visits = dailyTraffic.find((row) => row["date"] === date);
      const orders = dailyOrders.find((row) => row["date"] === date);
      const payments = dailyRevenue.find((row) => row["date"] === date);
      return {
        date,
        visitors: visits ? n(visits, "visitors") : 0,
        views: visits ? n(visits, "views") : 0,
        orders: orders ? n(orders, "count") : 0,
        revenue: payments ? n(payments, "amount") : 0,
      };
    }),
    statuses: statuses
      .map((row) => ({ label: String(row["label"]), count: n(row, "count") }))
      .sort((a, b) => STATUS_ORDER.indexOf(a.label) - STATUS_ORDER.indexOf(b.label)),
    topProducts: topProducts.map((row) => ({
      name: String(row["name"]),
      quantity: n(row, "quantity"),
      revenue: n(row, "revenue"),
    })),
    recentOrders: recent.map((row) => ({
      number: n(row, "number"),
      status: String(row["status"]),
      total: n(row, "total"),
      createdAt: new Date(String(row["created_at"])).toISOString(),
      paymentStatus: row["payment_status"] ? String(row["payment_status"]) : null,
    })),
  };
}
