import { afterEach, describe, expect, it, vi } from "vitest";
import { counterId, trackVerifiedPurchase } from "./analytics";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("conversion evidence", () => {
  it("disables tracking without a genuine configured counter", () => {
    for (const id of ["", "abc", "0", "123-45"]) expect(counterId(id)).toBeNull();
    expect(counterId("12345678")).toBe(12345678);
  });
  it("does not report pending or mock payments as purchases; deduplicates a real paid order", () => {
    vi.stubEnv("VITE_METRIKA_COUNTER_ID", "12345678");
    const ym = vi.fn();
    const storage = new Map<string, string>();
    vi.stubGlobal("window", { ym });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key),
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    const order = { id: "test-order", subtotal: 2750 };
    for (const status of ["pending", "mock_paid"])
      expect(trackVerifiedPurchase({ status, provider: "mock" }, order)).toBe(false);
    expect(ym).not.toHaveBeenCalled();
    expect(trackVerifiedPurchase({ status: "paid", provider: null }, order)).toBe(false);
    expect(trackVerifiedPurchase({ status: "paid", provider: "confirmed-provider" }, order)).toBe(
      true,
    );
    expect(trackVerifiedPurchase({ status: "paid", provider: "confirmed-provider" }, order)).toBe(
      false,
    );
    expect(ym).toHaveBeenCalledTimes(1);
    expect(ym).toHaveBeenCalledWith(12345678, "reachGoal", "purchase", {
      order_id: "test-order",
      value: 2750,
      currency: "RUB",
    });
  });
});
