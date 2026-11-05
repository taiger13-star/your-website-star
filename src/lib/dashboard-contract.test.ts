import { describe, expect, it } from "vitest";
import {
  dashboardPeriod,
  publicVisitPath,
  visitSchema,
  reportingWindow,
  csvCell,
} from "./dashboard-contract";

describe("dashboard input and reporting policy", () => {
  it("bounds query cost to supported Moscow calendar periods", () => {
    for (const days of [0, 2, 365, "30"])
      expect(dashboardPeriod.safeParse({ days }).success).toBe(false);
    const range = reportingWindow(7, new Date("2026-11-04T22:30:00Z"));
    expect(range.from.toISOString()).toBe("2026-10-29T21:00:00.000Z");
    expect(range.dates).toHaveLength(7);
    expect(range.dates.at(-1)).toBe("2026-11-05");
  });
  it("never records admin tokens, checkout identifiers, contacts or unknown paths", () => {
    expect(publicVisitPath("/catalog?email=secret#token")).toBe("/catalog");
    expect(publicVisitPath("/product/dune?color=black")).toBe("/product/dune");
    for (const path of [
      "/admin/private-token",
      "/account",
      "/checkout",
      "/order/private",
      "/not-real",
      "https://evil.test/",
      "//evil.test/",
    ])
      expect(publicVisitPath(path)).toBeNull();
  });
  it("rejects added personal fields and client timestamps", () => {
    const event = {
      eventId: "11111111-1111-4111-8111-111111111111",
      visitorId: "22222222-2222-4222-8222-222222222222",
      sessionId: "33333333-3333-4333-8333-333333333333",
      kind: "view",
      path: "/",
      device: "desktop",
      referrerHost: "yandex.ru",
    };
    expect(visitSchema.safeParse(event).success).toBe(true);
    for (const key of ["email", "userId", "createdAt", "ip"])
      expect(visitSchema.safeParse({ ...event, [key]: "private" }).success).toBe(false);
    expect(visitSchema.safeParse({ ...event, path: "/admin/secret" }).success).toBe(false);
    expect(
      visitSchema.safeParse({ ...event, referrerHost: "https://x.test/?email=secret" }).success,
    ).toBe(false);
  });
  it("neutralises spreadsheet formulas in exported aggregates", () => {
    expect(csvCell('=HYPERLINK("url")')).toBe('"\'=HYPERLINK(""url"")"');
    expect(csvCell(0)).toBe('"0"');
  });
});
