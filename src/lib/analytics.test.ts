import { afterEach, describe, expect, it, vi } from "vitest";
import { counterId, trackGoal, trackVerifiedPurchase } from "./analytics";

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
    const order = { id: "test-order", total: 2750, status: "completed" };
    const payment = {
      component: "product",
      status: "paid",
      provider: "confirmed-provider",
      paidAt: "2026-11-04T10:00:00Z",
      amount: 2750,
      currency: "RUB",
    };
    for (const status of ["pending", "mock_paid"])
      expect(trackVerifiedPurchase({ ...payment, status, provider: "mock" }, order)).toBe(false);
    expect(ym).not.toHaveBeenCalled();
    expect(trackVerifiedPurchase({ ...payment, provider: null }, order)).toBe(false);
    for (const invalid of [
      { component: "delivery" },
      { amount: 1 },
      { currency: "USD" },
      { paidAt: null },
      { paidAt: "invalid" },
    ]) {
      expect(trackVerifiedPurchase({ ...payment, ...invalid }, order)).toBe(false);
    }
    expect(trackVerifiedPurchase(payment, { ...order, status: "cancelled" })).toBe(false);
    expect(trackVerifiedPurchase({ ...payment, status: "mock_paid" }, order)).toBe(false);
    expect(trackVerifiedPurchase(payment, order)).toBe(true);
    expect(trackVerifiedPurchase(payment, order)).toBe(false);
    expect(ym).toHaveBeenCalledTimes(1);
    expect(ym).toHaveBeenCalledWith(12345678, "reachGoal", "purchase", {
      order_id: "test-order",
      value: 2750,
      order_price: 2750,
      currency: "RUB",
    });
  });
  it("never lets an unavailable or throwing counter interrupt a successful business action", () => {
    vi.stubEnv("VITE_METRIKA_COUNTER_ID", "12345678");
    vi.stubGlobal("window", {});
    expect(trackGoal("generate_lead", { form: "business" })).toBe(false);
    vi.stubGlobal("window", {
      ym: () => {
        throw new Error("blocked");
      },
    });
    expect(trackGoal("order_created", { order_id: "test" })).toBe(false);
  });
});
