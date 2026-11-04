// GET-only acceptance checks. No sign-in, forms, payments, CDEK or account changes.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const canonical = "https://noir-atelier.ru";
for (const origin of [
  "http://noir-atelier.ru",
  canonical,
  "http://www.noir-atelier.ru",
  "https://www.noir-atelier.ru",
]) {
  for (const path of ["/", "/catalog?utm_source=release-check"]) {
    let url = origin + path;
    const visited = new Set();
    let final;
    for (let hop = 0; hop < 6; hop++) {
      assert(!visited.has(url), "Redirect loop");
      visited.add(url);
      // Node's normal certificate/hostname checks remain enabled.
      final = await fetch(url, { redirect: "manual" });
      if ([301, 302, 303, 307, 308].includes(final.status)) {
        url = new URL(final.headers.get("location"), url).href;
        await final.body?.cancel();
      } else break;
    }
    assert.equal(url, canonical + path, "Redirect must retain path/query on the canonical host");
    assert.equal(final.status, 200);
    await final.body?.cancel();
  }
}
execFileSync(
  process.execPath,
  [fileURLToPath(new URL("../scripts/check-seo.mjs", import.meta.url)), canonical],
  { stdio: "inherit" },
);
const checked = new Set();
for (const path of [
  "/",
  "/smart",
  "/product/noir-essential-05",
  "/product/noir-essential-06",
  "/product/noir-essential-07",
]) {
  const response = await fetch(canonical + path);
  assert.equal(response.status, 200);
  const html = await response.text();
  if (path === "/smart")
    assert(html.includes("Поплавок сверху"), "Current top-float diagram is missing");
  const imageSources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]);
  const hasReviewedOldImage = imageSources.some((src) =>
    /smart-(?:detail|0[123])(?:[-.]|$)|2a784773-efea-4aef-af02-70dd1ef9edf8|2ca2ecc1-1cbd-4031-9f8d-3f2316d94156|70a64f59-414a-4ba8-a417-1bdf7af51f24/.test(
      src,
    ),
  );
  if (hasReviewedOldImage)
    assert(
      /<(?:p|span|figcaption)\b[^>]*>Архивная визуализация/.test(html),
      "Historical media has no rendered archive notice",
    );
  for (const match of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll("&amp;", "&"), canonical);
    if (checked.has(url.href)) continue;
    checked.add(url.href);
    const image = await fetch(url);
    assert.equal(image.status, 200, "An image could not be loaded");
    assert((await image.arrayBuffer()).byteLength > 0, "Empty image response");
  }
}
console.log(
  `PASS: 8 domain/path checks, sitemap/canonical/404, SMART content and ${checked.size} image responses.`,
);
console.log(
  "Order flow still requires the separately approved browser test; no order was submitted by this script.",
);
