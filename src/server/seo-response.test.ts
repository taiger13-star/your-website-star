import { describe, expect, it, vi } from "vitest";
import { applyIndexingHeaders, seoEndpoint } from "./seo-response";
import type { CatalogSnapshot } from "./catalog-service";

describe("SEO HTTP responses", () => {
  it("preserves streamed private download bytes and file headers without touching storage", async () => {
    const bytes = new Uint8Array([0, 255, 3, 90, 13, 10]);
    const response = applyIndexingHeaders(
      new Request("http://localhost/_serverFn/download"),
      new Response(bytes, {
        headers: {
          "content-type": "application/octet-stream",
          "content-disposition": 'attachment; filename="model.stl"',
          "set-cookie": "test-session=placeholder; HttpOnly",
        },
      }),
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(response.headers.get("content-type")).toBe("application/octet-stream");
    expect(response.headers.get("content-disposition")).toContain("model.stl");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("rebuilds sitemap from the current catalog and propagates database failures", async () => {
    const catalog = { products: [], collections: [], sizes: [], colors: [] } as CatalogSnapshot;
    const load = vi.fn(async () => catalog);
    const req = new Request("http://localhost/sitemap.xml");
    expect((await seoEndpoint(req, load))?.status).toBe(200);
    catalog.products.push({ slug: "new", variants: [{ price: 3000 }] } as never);
    expect(await (await seoEndpoint(req, load))?.text()).toContain("/product/new");
    expect(load).toHaveBeenCalledTimes(2);
    await expect(
      seoEndpoint(req, async () => {
        throw new Error("DB down");
      }),
    ).rejects.toThrow("DB down");
  });
  it("preserves real status codes and makes error/private/filter pages noindex", () => {
    for (const [path, status] of [
      ["/missing", 404],
      ["/account", 200],
      ["/catalog?color=ink", 200],
      ["/catalog", 500],
    ] as const) {
      const response = applyIndexingHeaders(
        new Request(`http://localhost${path}`),
        new Response("body", { status }),
      );
      expect(response.status).toBe(status);
      expect(response.headers.get("x-robots-tag")).toBe("noindex, follow");
    }
    const res = applyIndexingHeaders(new Request("http://localhost/checkout"), new Response());
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });
  it("normalises trailing slashes without redirecting POST or credential-bearing paths", async () => {
    const load = vi.fn();
    expect(
      (await seoEndpoint(new Request("http://localhost/catalog/?q=test"), load))?.headers.get(
        "location",
      ),
    ).toBe("/catalog?q=test");
    expect(
      await seoEndpoint(new Request("http://localhost/cart/", { method: "POST" }), load),
    ).toBeUndefined();
    expect(await seoEndpoint(new Request("http://localhost/admin/token/"), load)).toBeUndefined();
    expect(load).not.toHaveBeenCalled();
  });
});
