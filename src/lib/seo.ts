import type { CatalogSnapshot, PublicProduct } from "@/server/catalog-service";

// Stable public origin: preview hosts must never become canonical URLs.
export const SITE_ORIGIN = "https://noir-atelier.ru";
function decodePath(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
export const STATIC_PAGES: Record<string, [string, string]> = {
  "/": [
    "NOIR ATELIER — дизайнерские кашпо и предметы интерьера",
    "Дизайнерские кашпо, вазы и интерьерные объекты NOIR ATELIER (Нуар Ателье). Выбор размера, цвета, исполнения Standard или с автополивом NOIR SMART. Изделия на заказ.",
  ],
  "/catalog": [
    "Купить дизайнерские кашпо — каталог NOIR ATELIER",
    "Каталог NOIR ATELIER: дизайнерские кашпо, вазы и объекты. Сравните формы, размеры и цены, выберите цвет и исполнение Standard или NOIR SMART с автополивом.",
  ],
  "/collections": [
    "Коллекции дизайнерских кашпо — NOIR ATELIER",
    "Коллекции NOIR ATELIER: формы, материалы и цветовые решения. Выберите серию и перейдите к изделиям с актуальными размерами и ценами.",
  ],
  "/smart": [
    "Кашпо с автополивом NOIR SMART — NOIR ATELIER",
    "Дизайнерские кашпо NOIR SMART с резервуаром для воды и пассивным автополивом. Устройство системы и сравнение с исполнением Standard.",
  ],
  "/configurator": [
    "Кашпо на заказ по размеру и цвету — NOIR ATELIER",
    "Выберите размер, цвет и систему в карточке кашпо NOIR ATELIER. Для нового размера или формы отправьте задачу на индивидуальную разработку изделия.",
  ],
  "/3d-printing": [
    "3D-печать изделий на заказ — NOIR ATELIER",
    "Изготовление по вашей 3D-модели: выбор материала, предварительный расчёт и заявка на 3D-печать. Загрузите STL, OBJ, 3MF, STEP или IGES для проверки.",
  ],
  "/3d-design": [
    "Разработка кашпо и изделий на заказ — NOIR ATELIER",
    "Создание изделия с нуля: опишите форму, нужные размеры и назначение. Отправьте эскиз или референс для обсуждения моделирования и 3D-печати.",
  ],
  "/business": [
    "Кашпо и интерьерные изделия для бизнеса — NOIR ATELIER",
    "Индивидуальные проекты NOIR ATELIER для дизайнеров и бизнеса. Обсудите форму, размеры, цвет и количество изделий для вашего пространства.",
  ],
  "/about": [
    "О бренде NOIR ATELIER — дизайн и 3D-печать",
    "NOIR ATELIER — дизайнерские предметы интерьера, цифровое моделирование и производство под заказ в России. Познакомьтесь с подходом бренда.",
  ],
  "/contacts": [
    "Контакты NOIR ATELIER — вопросы и индивидуальный заказ",
    "Свяжитесь с NOIR ATELIER по вопросам каталога, индивидуальных изделий и заказа. Телефон, электронная почта и реквизиты продавца.",
  ],
  "/delivery": [
    "Доставка и получение заказа — NOIR ATELIER",
    "Доставка изделий NOIR ATELIER через СДЭК: пункт выдачи или курьер. Расчёт стоимости и выбор способа получения при оформлении заказа.",
  ],
  "/returns": [
    "Возврат и обращение по заказу — NOIR ATELIER",
    "Условия возврата изделий NOIR ATELIER, проверка заказа при получении и порядок обращения к продавцу.",
  ],
};

export function absoluteUrl(path: string) {
  const url = new URL(path, SITE_ORIGIN);
  return url.origin === SITE_ORIGIN ? url.href : new URL(url.pathname, SITE_ORIGIN).href;
}

export function isPrivatePath(path: string) {
  return /^\/(admin|account|cart|checkout|wishlist|order|login|register|forgot-password|reset-password|verify-email|_serverFn|api)(\/|$)/.test(
    path,
  );
}

export function catalogPolicy(search: Record<string, unknown> = {}) {
  const keys = ["q", "collection", "category", "color", "system"];
  const active = keys.filter(
    (key) => typeof search[key] === "string" && String(search[key]).trim(),
  );
  if (active.length === 1 && active[0] === "collection") {
    return {
      path: `/collections/${encodeURIComponent(String(search["collection"]))}`,
      noindex: false,
    };
  }
  const params = new URLSearchParams();
  for (const key of keys) if (active.includes(key)) params.set(key, String(search[key]));
  return { path: `/catalog${params.size ? `?${params}` : ""}`, noindex: active.length > 0 };
}

export function pageHead(
  path: string,
  search: Record<string, unknown> = {},
  catalog?: CatalogSnapshot,
  missing = false,
) {
  const utilityTitles: Record<string, string> = {
    "/privacy": "Политика обработки персональных данных",
    "/data": "Согласие на обработку персональных данных",
    "/terms": "Пользовательское соглашение",
    "/cart": "Корзина",
    "/checkout": "Оформление заказа",
    "/login": "Вход",
    "/register": "Регистрация",
    "/wishlist": "Избранное",
    "/account": "Личный кабинет",
    "/forgot-password": "Восстановление пароля",
    "/reset-password": "Новый пароль",
    "/verify-email": "Подтверждение почты",
  };
  let [title, description] = STATIC_PAGES[path] ?? [
    `${utilityTitles[path] ?? "Служебная страница"} — NOIR ATELIER`,
    "Дизайнерские кашпо и предметы интерьера NOIR ATELIER.",
  ];
  let canonical = path;
  let noindex = isPrivatePath(path) || ["/privacy", "/data", "/terms"].includes(path);
  let image: string | undefined;
  const productSlug = path.startsWith("/product/") ? decodePath(path.slice(9)) : null;
  const collectionSlug = path.startsWith("/collections/") ? decodePath(path.slice(13)) : null;
  if (path === "/catalog") {
    const policy = catalogPolicy(search);
    canonical = policy.path;
    noindex = policy.noindex;
    if (
      search["collection"] &&
      !catalog?.collections.some((c) => c.slug === search["collection"])
    ) {
      canonical = `/catalog?collection=${encodeURIComponent(String(search["collection"]))}`;
      noindex = true;
    }
  }
  if (productSlug) {
    const product = catalog?.products.find((p) => p.slug === productSlug && p.variants.length);
    if (product) {
      title = `${product.name} — ${product.collectionName} | NOIR ATELIER`;
      description = `${product.shortDescription} Размер, цвет, исполнение и актуальная цена ${product.name} в каталоге NOIR ATELIER.`;
      image = product.images[0];
    } else missing = true;
  }
  if (collectionSlug) {
    const collection = catalog?.collections.find((c) => c.slug === collectionSlug);
    if (collection) {
      title = `${collection.name} — коллекция NOIR ATELIER`;
      description =
        collection.description ||
        `${collection.name}: ${collection.tagline}. Изделия, размеры, цвета и цены NOIR ATELIER.`;
      image = collection.cover ?? undefined;
    } else missing = true;
  }
  if (missing) {
    title = "Страница не найдена — NOIR ATELIER";
    description = "Страница не найдена. Перейдите в актуальный каталог NOIR ATELIER.";
    noindex = true;
  }
  return {
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "robots",
        content: noindex ? "noindex, follow" : "index, follow, max-image-preview:large",
      },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      ...(!isPrivatePath(path) && !missing
        ? [{ property: "og:url", content: absoluteUrl(canonical) }]
        : []),
      { property: "og:type", content: productSlug && !missing ? "product" : "website" },
      ...(image ? [{ property: "og:image", content: new URL(image, SITE_ORIGIN).href }] : []),
    ],
    links:
      missing || isPrivatePath(path) ? [] : [{ rel: "canonical", href: absoluteUrl(canonical) }],
  };
}

export function productSchema(product: PublicProduct, variant: PublicProduct["variants"][number]) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(`/product/${product.slug}`)}#product`,
    name: product.name,
    description: product.description || product.shortDescription,
    image: product.images.map((src) => new URL(src, SITE_ORIGIN).href),
    sku: product.sku,
    brand: { "@type": "Brand", name: "NOIR ATELIER" },
    ...(product.materials.length ? { material: product.materials.join(", ") } : {}),
    ...(product.isComingSoon
      ? {}
      : {
          offers: {
            "@type": "Offer",
            url: absoluteUrl(`/product/${product.slug}`),
            price: variant.price,
            priceCurrency: "RUB",
            // No stock field exists in the catalog. Do not invent InStock or delivery promises.
            seller: { "@id": `${SITE_ORIGIN}/#organization` },
          },
        }),
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function sitemapXml(catalog: CatalogSnapshot) {
  const paths = [
    ...Object.keys(STATIC_PAGES),
    ...catalog.collections.map((c) => `/collections/${encodeURIComponent(c.slug)}`),
    ...catalog.products
      .filter((p) => p.variants.length)
      .map((p) => `/product/${encodeURIComponent(p.slug)}`),
  ];
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  // No invented lastmod: regenerated from the published catalog on every request.
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(paths)].map((p) => `<url><loc>${escape(absoluteUrl(p))}</loc></url>`).join("")}</urlset>`;
}

export const ROBOTS_TXT = `User-agent: *\nAllow: /\n\nUser-agent: Yandex\nAllow: /\nClean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content&gclid&yclid&fbclid\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
