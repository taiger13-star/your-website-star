import { afterEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ path: "", ym: vi.fn(), append: vi.fn() }));
vi.mock("react", () => ({ useEffect: (callback: () => void) => callback() }));
vi.mock("@tanstack/react-router", () => ({ useRouterState: () => state.path }));
vi.mock("@/lib/analytics", () => ({ counterId: () => 114077852 }));
import { SITE_ORIGIN } from "@/lib/seo";
import { Analytics } from "./Analytics";

describe("private routes do not initialise third-party analytics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });
  for (const path of ["/admin/private-route", "/account", "/order/private-order"])
    it(path, () => {
      state.path = path;
      vi.stubGlobal("window", { location: { origin: SITE_ORIGIN }, ym: state.ym });
      vi.stubGlobal("document", {
        querySelector: () => null,
        createElement: () => ({}),
        head: { appendChild: state.append },
      });
      Analytics();
      expect(state.append).not.toHaveBeenCalled();
      expect(state.ym).not.toHaveBeenCalled();
    });
});
