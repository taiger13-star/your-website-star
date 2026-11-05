import { beforeEach, describe, expect, it, vi } from "vitest";
const mocked = vi.hoisted(() => ({ admin: vi.fn(), load: vi.fn() }));
vi.mock("./auth", () => ({ requireAdmin: mocked.admin }));
vi.mock("./dashboard-service", () => ({ loadDashboard: mocked.load }));
import { readAdminDashboard } from "./dashboard-access";

describe("dashboard server boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("checks the admin session before any database read", async () => {
    mocked.admin.mockImplementation(() => {
      throw Error("UNAUTHORIZED");
    });
    await expect(readAdminDashboard({ days: 7 })).rejects.toThrow("UNAUTHORIZED");
    expect(mocked.load).not.toHaveBeenCalled();
  });
  it("validates period on the server and returns only the report", async () => {
    await expect(readAdminDashboard({ days: 999 })).rejects.toThrow();
    expect(mocked.load).not.toHaveBeenCalled();
    mocked.load.mockResolvedValue({ generatedAt: "verified" });
    expect(await readAdminDashboard({ days: 30 })).toEqual({ generatedAt: "verified" });
    expect(mocked.load).toHaveBeenCalledWith(30);
  });
});
