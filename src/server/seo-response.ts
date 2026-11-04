import { catalogPolicy, isPrivatePath, ROBOTS_TXT, sitemapXml } from "@/lib/seo";
import type { CatalogSnapshot } from "./catalog-service";

export async function seoEndpoint(request: Request, catalog: () => Promise<CatalogSnapshot>) {
  const url = new URL(request.url);
  if (!["GET", "HEAD"].includes(request.method)) return;
  if (url.pathname === "/robots.txt")
    return new Response(request.method === "HEAD" ? null : ROBOTS_TXT, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  if (url.pathname === "/sitemap.xml") {
    // Failure must remain a real 5xx; never serve an empty/fabricated successful sitemap.
    const xml = sitemapXml(await catalog());
    return new Response(request.method === "HEAD" ? null : xml, {
      headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "no-cache" },
    });
  }
  // Public path normalisation only; never redirect POSTs or credential-bearing private URLs.
  if (!isPrivatePath(url.pathname) && /\/$/.test(url.pathname) && url.pathname !== "/") {
    return new Response(null, {
      status: 308,
      headers: { location: url.pathname.replace(/^\/+/, "/").replace(/\/+$/, "") + url.search },
    });
  }
  return undefined;
}

export function applyIndexingHeaders(request: Request, response: Response) {
  const url = new URL(request.url);
  const noindex =
    response.status >= 400 ||
    isPrivatePath(url.pathname) ||
    ["/privacy", "/data", "/terms"].includes(url.pathname) ||
    (url.pathname === "/catalog" && catalogPolicy(Object.fromEntries(url.searchParams)).noindex);
  const headers = new Headers(response.headers);
  if (noindex) headers.set("X-Robots-Tag", "noindex, follow");
  if (isPrivatePath(url.pathname)) headers.set("Cache-Control", "private, no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
