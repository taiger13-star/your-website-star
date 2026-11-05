import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const siteSessions = pgTable(
  "site_sessions",
  {
    id: uuid("id").primaryKey(),
    visitorId: uuid("visitor_id").notNull(),
    firstSeen: timestamp("first_seen", { withTimezone: true }).notNull(),
    lastSeen: timestamp("last_seen", { withTimezone: true }).notNull(),
  },
  (table) => [index("site_sessions_last_seen_idx").on(table.lastSeen)],
);

export const sitePageViews = pgTable(
  "site_page_views",
  {
    id: uuid("id").primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => siteSessions.id, { onDelete: "cascade" }),
    visitorId: uuid("visitor_id").notNull(),
    path: varchar("path", { length: 200 }).notNull(),
    device: varchar("device", { length: 12 }).notNull(),
    referrerHost: varchar("referrer_host", { length: 120 }).notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("site_page_views_viewed_idx").on(table.viewedAt),
    index("site_page_views_session_idx").on(table.sessionId),
  ],
);
