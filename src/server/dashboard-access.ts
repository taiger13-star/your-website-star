import { dashboardPeriod } from "../lib/dashboard-contract";
import { requireAdmin } from "./auth";
import { loadDashboard } from "./dashboard-service";

export async function readAdminDashboard(input: unknown) {
  requireAdmin();
  return loadDashboard(dashboardPeriod.parse(input).days);
}
