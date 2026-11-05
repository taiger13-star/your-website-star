import { describe, expect, it } from "vitest";
import { createVisitLimiter } from "./visit-store";

describe("bounded public collection", () => {
  it("limits an individual browser and resets its minute budget", () => {
    const allow = createVisitLimiter();
    for (let i = 0; i < 20; i++) expect(allow("visitor", 0)).toBe(true);
    expect(allow("visitor", 0)).toBe(false);
    expect(allow("visitor", 60000)).toBe(true);
  });
  it("limits the process even when browser identities rotate", () => {
    const allow = createVisitLimiter();
    for (let i = 0; i < 600; i++) expect(allow(`visitor-${i}`, 0)).toBe(true);
    expect(allow("new-visitor", 0)).toBe(false);
  });
});
