import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

import { getCollection, minPrice, searchProducts } from "@/lib/catalog";
import { formatPrice, plural } from "@/lib/format";
import { useShopUI } from "@/store/ui";

export function SearchOverlay() {
  const { searchOpen, closeSearch, openSearch } = useShopUI();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!searchOpen) setQuery("");
  }, [searchOpen]);

  const results = useMemo(() => searchProducts(query, 6), [query]);

  const go = (slug: string) => {
    closeSearch();
    void navigate({ to: "/product/$slug", params: { slug } });
  };

  return (
    <SheetPrimitive.Root
      open={searchOpen}
      onOpenChange={(open) => {
        if (!open) closeSearch();
        else openSearch();
      }}
    >
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <SheetPrimitive.Content
          className="fixed inset-x-0 top-0 z-50 max-h-[85vh] overflow-y-auto border-b border-hairline bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top"
        >
          <div className="container-page py-8">
            <div className="flex items-center justify-between">
              <SheetPrimitive.Title className="label-caps text-taupe">Поиск</SheetPrimitive.Title>
              <SheetPrimitive.Close
                aria-label="Закрыть поиск"
                className="flex h-9 w-9 items-center justify-center text-ink-soft transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" strokeWidth={1.25} />
              </SheetPrimitive.Close>
            </div>

            <div className="mt-5 flex items-center gap-3 border-b border-ink/25 pb-3">
              <Search className="h-5 w-5 text-taupe" strokeWidth={1.25} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Название, коллекция или тип изделия"
                aria-label="Поиск по каталогу"
                className="w-full bg-transparent font-display text-2xl text-foreground outline-none placeholder:text-taupe md:text-3xl"
              />
            </div>

            {query.trim() ? (
              <div className="mt-6">
                {results.length ? (
                  <>
                    <ul className="divide-y divide-hairline">
                      {results.map((product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => go(product.slug)}
                            className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-secondary/60"
                          >
                            <img
                              src={product.images[0]}
                              alt=""
                              loading="lazy"
                              className="h-16 w-14 object-cover"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="label-caps block text-taupe">
                                {getCollection(product.collection)?.name}
                              </span>
                              <span className="mt-1 block truncate font-display text-xl text-foreground">
                                {product.name}
                              </span>
                              <span className="mt-1 block truncate text-sm text-muted-foreground">
                                {product.shortDescription}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm text-ink">
                              от {formatPrice(minPrice(product))}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <SheetPrimitive.Description asChild>
                      <button
                        type="button"
                        onClick={() => {
                          closeSearch();
                          void navigate({ to: "/catalog", search: { q: query } });
                        }}
                        className="mt-6 text-xs uppercase tracking-[0.18em] text-ink underline underline-offset-4"
                      >
                        Показать все результаты · {results.length}{" "}
                        {plural(results.length, "модель", "модели", "моделей")}
                      </button>
                    </SheetPrimitive.Description>
                  </>
                ) : (
                  <p className="py-10 text-sm text-muted-foreground">
                    Ничего не нашлось по запросу «{query}». Попробуйте «кашпо», «ваза» или название
                    коллекции.
                  </p>
                )}
              </div>
            ) : (
              <p className="py-10 text-sm text-muted-foreground">
                Начните вводить название модели, коллекцию или тип изделия.
              </p>
            )}
          </div>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
