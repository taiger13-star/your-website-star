import { createServerFn } from "@tanstack/react-start";
import { dashboardPeriod, visitSchema } from "./dashboard-contract";

export const getAdminDashboardFn = createServerFn({ method: "POST" })
  .validator(dashboardPeriod)
  .handler(async ({ data }) => {
    const { readAdminDashboard } = await import("../server/dashboard-access");
    return readAdminDashboard(data);
  });

export const collectSiteVisitFn = createServerFn({ method: "POST" })
  .validator(visitSchema)
  .handler(async ({ data }) => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { allowVisit, recordVisit } = await import("../server/visit-store");
    const { SITE_ORIGIN } = await import("./seo");
    const origin = getRequestHeader("origin");
    const allowed = new Set([SITE_ORIGIN]);
    if (process.env["DASHBOARD_ENVIRONMENT"] === "test")
      allowed.add(process.env["DASHBOARD_PREVIEW_ORIGIN"] || "http://127.0.0.1:8844");
    if (!origin || !allowed.has(origin) || !allowVisit(data.visitorId))
      return { collected: false, duplicate: false };
    return recordVisit(data);
  });
