// Read-only smoke test for a running Node/Nitro build. No forms, payments or accounts.
import assert from "node:assert/strict";

const base = new URL(process.argv[2] ?? "http://127.0.0.1:8770");
const canonicalOrigin = "https://noir-atelier.ru";
const get = async (path) => {
  const response = await fetch(new URL(path, base), { redirect: "manual" });
  return { response, html: await response.text() };
};
const { response, html: sitemap } = await get("/sitemap.xml");
assert.equal(response.status, 200, "sitemap must return 200");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  m[1].replaceAll("&amp;", "&"),
);
assert(urls.length > 0 && urls.length === new Set(urls).size);
for (const url of urls) {
  const u = new URL(url);
  assert.equal(u.origin, canonicalOrigin);
  assert(!u.search && !u.hash);
  const { response: page, html } = await get(u.pathname);
  assert.equal(page.status, 200, url);
  assert(html.includes(`rel="canonical" href="${url}"`), `canonical: ${url}`);
  assert(!/name="robots" content="[^"]*noindex/.test(html), `robots: ${url}`);
  assert(/<h1[ >]/.test(html) && /<title>[^<]+<\/title>/.test(html), `SSR content: ${url}`);
}
for (const path of [
  "/__seo_missing_page__",
  "/product/__seo_missing_product__",
  "/collections/__seo_missing_collection__",
]) {
  const { response } = await get(path);
  assert.equal(response.status, 404, path);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, follow");
}
const { html: robots } = await get("/robots.txt");
assert(robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`));
console.log(
  `SEO smoke test passed: ${urls.length} canonical HTTP 200 pages, 3 real 404s, robots/Sitemap.`,
);
