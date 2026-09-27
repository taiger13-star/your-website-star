import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BRAND, NAV_LINKS } from "../lib/brand";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CartDrawer } from "../components/site/CartDrawer";
import { SearchOverlay } from "../components/site/SearchOverlay";
import { Toaster } from "../components/ui/sonner";
import { CartProvider } from "../store/cart";
import { WishlistProvider } from "../store/wishlist";
import { UIProvider } from "../store/ui";

function NotFoundComponent() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="label-caps text-taupe">Ошибка 404</p>
      <h1 className="display-lg mt-5 text-foreground">Страница не найдена</h1>
      <p className="prose-noir mx-auto mt-5">
        Возможно, изделие снято с производства или ссылка устарела. Начните с каталога — там вся
        текущая коллекция NOIR ATELIER.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/catalog"
          className="bg-ink px-8 py-4 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-85"
        >
          В каталог
        </Link>
        <Link
          to="/"
          className="border border-ink/25 px-8 py-4 text-xs font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink"
        >
          На главную
        </Link>
      </div>
      <nav className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3" aria-label="Разделы сайта">
        {NAV_LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="label-caps text-taupe transition-colors hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="label-caps text-taupe">Сбой загрузки</p>
      <h1 className="display-md mt-5 text-foreground">Эта страница не открылась</h1>
      <p className="prose-noir mx-auto mt-5">
        Что-то пошло не так на нашей стороне. Попробуйте обновить страницу или вернуться в каталог.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="bg-ink px-8 py-4 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-85"
        >
          Попробовать снова
        </button>
        <a
          href="/catalog"
          className="border border-ink/25 px-8 py-4 text-xs font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink"
        >
          В каталог
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${BRAND.name} — ${BRAND.valuesRu}` },
      {
        name: "description",
        content: `${BRAND.name}: ${BRAND.heroLine} Производство в ${BRAND.country}, изделия под заказ.`,
      },
      { name: "author", content: BRAND.name },
      { name: "theme-color", content: "#0B0B0A" },
      { property: "og:site_name", content: BRAND.name },
      { property: "og:title", content: `${BRAND.name} — ${BRAND.valuesRu}` },
      {
        property: "og:description",
        content: BRAND.heroLine,
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ru_RU" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Manrope:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <UIProvider>
        <CartProvider>
          <WishlistProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
              Перейти к содержимому
            </a>
            <Header />
            <main id="main">
              <Outlet />
            </main>
            <Footer />
            <CartDrawer />
            <SearchOverlay />
            <Toaster position="bottom-center" richColors={false} closeButton />
          </WishlistProvider>
        </CartProvider>
      </UIProvider>
    </QueryClientProvider>
  );
}
