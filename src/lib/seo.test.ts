import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  catalogPolicy,
  pageHead,
  productSchema,
  serializeJsonLd,
  sitemapXml,
} from "./seo";
import type { CatalogSnapshot, PublicProduct } from "@/server/catalog-service";

const product = {
  id: "one",
  slug: "vase",
  sku: "N-1",
  name: "Ваза",
  shortDescription: "Описание",
  description: "Описание изделия",
  images: ["/image.jpg"],
  materials: ["PETG"],
  variants: [
    { id: "small", price: 2750 },
    { id: "large", price: 5100 },
  ],
} as PublicProduct;
const catalog = {
  products: [product, { ...product, slug: "disabled", variants: [] }],
  collections: [{ id: "flow", slug: "flow", name: "FLOW", description: "Плавная форма" }],
  sizes: [],
  colors: [],
} as unknown as CatalogSnapshot;

describe("search engine policy", () => {
  it("keeps sorts/tracking out of canonical URLs, preserves meaningful compound filters under noindex", () => {
    expect(catalogPolicy({ sort: "price-asc", utm_source: "ad" })).toEqual({
      path: "/catalog",
      noindex: false,
    });
    expect(catalogPolicy({ collection: "flow", sort: "new" })).toEqual({
      path: "/collections/flow",
      noindex: false,
    });
    expect(catalogPolicy({ collection: "flow", system: "smart", yclid: "1" })).toEqual({
      path: "/catalog?collection=flow&system=smart",
      noindex: true,
    });
    expect(pageHead("/catalog", { collection: "missing" }, catalog).meta).toContainEqual({
      name: "robots",
      content: "noindex, follow",
    });
  });
  it("excludes private, unknown and unavailable product pages from sitemap", () => {
    const xml = sitemapXml(catalog);
    expect(xml).toContain("https://noir-atelier.ru/product/vase");
    expect(xml).toContain("https://noir-atelier.ru/collections/flow");
    for (const excluded of [
      "/checkout",
      "/login",
      "/admin",
      "/account",
      "product/disabled",
      "utm_",
      "<lastmod>",
    ])
      expect(xml).not.toContain(excluded);
    expect(pageHead("/product/missing", {}, catalog).links).toEqual([]);
    expect(pageHead("/product/%ZZ", {}, catalog).links).toEqual([]);
    expect(pageHead("/account", {}, catalog).meta).toContainEqual({
      name: "robots",
      content: "noindex, follow",
    });
    expect(
      pageHead("/admin/private-test-token", {}, catalog).meta.some(
        (m) => "property" in m && m.property === "og:url",
      ),
    ).toBe(false);
  });
  it("uses the displayed variant price, never synthesises stock or ratings", () => {
    const schema = productSchema(product, product.variants[1]!);
    expect(schema.offers?.price).toBe(5100);
    expect(schema.offers?.priceCurrency).toBe("RUB");
    expect(schema.offers).not.toHaveProperty("availability");
    expect(schema).not.toHaveProperty("aggregateRating");
    expect(schema.image).toEqual(["https://noir-atelier.ru/image.jpg"]);
    expect(
      productSchema({ ...product, isComingSoon: true }, product.variants[0]!),
    ).not.toHaveProperty("offers");
  });
  it("escapes catalog content embedded in JSON-LD and prevents foreign canonical origins", () => {
    const malicious = { name: '</script><script>alert("x")</script>\u2028' };
    const encoded = serializeJsonLd(malicious);
    expect(encoded).not.toContain("<");
    expect(JSON.parse(encoded)).toEqual(malicious);
    expect(absoluteUrl("https://example.test/product/a")).toBe("https://noir-atelier.ru/product/a");
  });
});
