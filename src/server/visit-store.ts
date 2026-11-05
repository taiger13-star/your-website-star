import { sql } from "drizzle-orm";
import { visitSchema, type VisitEvent } from "../lib/dashboard-contract";
import { getDb } from "./db";

export function createVisitLimiter() {
  const visitors = new Map<string, { minute: number; count: number }>();
  let minute = -1,
    count = 0;
  return (id: string, now = Date.now()) => {
    const current = Math.floor(now / 60000);
    if (current !== minute) {
      minute = current;
      count = 0;
      visitors.clear();
    }
    if (++count > 600) return false;
    if (!visitors.has(id) && visitors.size >= 2048) return false;
    const item = visitors.get(id) ?? { minute: current, count: 0 };
    item.count++;
    visitors.set(id, item);
    return item.count <= 20;
  };
}

export const allowVisit = createVisitLimiter();
let nextCleanup = 0;

export async function recordVisit(input: VisitEvent, now = new Date()) {
  const event = visitSchema.parse(input);
  const db = getDb();
  const at = now.toISOString();
  const result = await db.transaction(async (tx) => {
    if (event.kind === "heartbeat") {
      const rows = await tx.execute(sql`UPDATE site_sessions SET last_seen=${at}::timestamptz
        WHERE id=${event.sessionId}::uuid AND visitor_id=${event.visitorId}::uuid RETURNING id`);
      return { collected: rows.length > 0, duplicate: false };
    }
    const session =
      await tx.execute(sql`INSERT INTO site_sessions (id,visitor_id,first_seen,last_seen)
      VALUES (${event.sessionId}::uuid,${event.visitorId}::uuid,${at}::timestamptz,${at}::timestamptz)
      ON CONFLICT (id) DO UPDATE SET last_seen=EXCLUDED.last_seen
      WHERE site_sessions.visitor_id=EXCLUDED.visitor_id RETURNING id`);
    if (!session.length) return { collected: false, duplicate: false };
    const rows =
      await tx.execute(sql`INSERT INTO site_page_views (id,session_id,visitor_id,path,device,referrer_host,viewed_at)
      VALUES (${event.eventId}::uuid,${event.sessionId}::uuid,${event.visitorId}::uuid,${event.path},${event.device},${event.referrerHost},${at}::timestamptz)
      ON CONFLICT (id) DO NOTHING RETURNING id`);
    return { collected: true, duplicate: !rows.length };
  });
  if (now.getTime() >= nextCleanup) {
    nextCleanup = now.getTime() + 600000;
    const cutoff = new Date(now.getTime() - 90 * 86400000).toISOString();
    try {
      await db.execute(
        sql`DELETE FROM site_page_views WHERE id IN (SELECT id FROM site_page_views WHERE viewed_at<${cutoff}::timestamptz ORDER BY viewed_at LIMIT 10000)`,
      );
      await db.execute(
        sql`DELETE FROM site_sessions WHERE id IN (SELECT id FROM site_sessions WHERE last_seen<${cutoff}::timestamptz ORDER BY last_seen LIMIT 10000)`,
      );
    } catch {
      /* Bounded cleanup is retried later; a recorded view remains valid. */
    }
  }
  return result;
}
