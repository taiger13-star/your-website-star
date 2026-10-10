/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useMemo } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Search, X } from "lucide-react";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { EmptyState } from "@/components/site/EmptyState";
import { ProductCard } from "@/components/product/ProductCard";
import { useCatalog } from "@/store/catalog";

type CatalogSearch = {
  q?: string;
  collection?: string;
  category?: string;
  color?: string;
  system?: "standard" | "smart";
  sort?: "popular" | "new" | "price-asc" | "price-desc";
};

export const Route = createFileRoute("/catalog")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    q: typeof search.q === "string" ? search.q.slice(0, 80) : undefined,
    collection: typeof search.collection === "string" ? search.collection : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    color: typeof search.color === "string" ? search.color : undefined,
    system: search.system === "standard" || search.system === "smart" ? search.system : undefined,
    sort: ["popular", "new", "price-asc", "price-desc"].includes(String(search.sort))
      ? (search.sort as CatalogSearch["sort"])
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Каталог — NOIR ATELIER" },
      { name: "description", content: "Каталог дизайнерских изделий NOIR ATELIER." },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { products, collections, colors } = useCatalog();
  const search = useSearch({ from: "/catalog" });
  const navigate = useNavigate({ from: "/catalog" });
  const categories = [...new Set(products.map((product) => product.category))];
  const collection = collections.find((item) => item.slug === search.collection);
  const result = useMemo(() => {
    const query = search.q?.trim().toLowerCase();
    const filtered = products.filter((product) => {
      if (search.collection && product.collectionSlug !== search.collection) return false;
      if (search.category && product.category !== search.category) return false;
      if (search.color && !product.colors.some((color) => color.id === search.color)) return false;
      if (search.system && !product.variants.some((variant) => variant.system === search.system))
        return false;
      return (
        !query ||
        [product.name, product.shortDescription, product.description, product.collectionName]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    });
    return [...filtered].sort((a, b) => {
      if (search.sort === "new") return b.releasedAt.localeCompare(a.releasedAt);
      if (search.sort === "price-asc")
        return (
          Math.min(...a.variants.map((x) => x.price)) - Math.min(...b.variants.map((x) => x.price))
        );
      if (search.sort === "price-desc")
        return (
          Math.max(...b.variants.map((x) => x.price)) - Math.max(...a.variants.map((x) => x.price))
        );
      return (
        Number(b.isBestseller) - Number(a.isBestseller) ||
        Number(b.featured) - Number(a.featured) ||
        a.name.localeCompare(b.name, "ru")
      );
    });
  }, [products, search]);
  const update = (patch: Partial<CatalogSearch>) =>
    void navigate({
      to: "/catalog",
      search: (previous: CatalogSearch) => ({ ...previous, ...patch }),
    });
  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Каталог" }]} />
      <div className="mt-6 border-b border-hairline pb-8">
        <p className="label-caps text-taupe">Каталог</p>
        <h1 className="display-lg mt-4 text-foreground">
          {collection ? collection.name : "Кашпо, вазы и объекты"}
        </h1>
        <p className="prose-noir mt-4">
          {collection?.description ??
            "Выбирайте форму, цвет, размер и систему Standard или NOIR SMART."}
        </p>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="space-y-5 border-b border-hairline pb-6 lg:border-b-0 lg:border-r lg:pr-7">
          <div>
            <label htmlFor="catalog-search" className="label-caps text-taupe">
              Поиск
            </label>
            <div className="mt-2 flex min-h-14 items-center gap-3 border-b border-ink/30 transition-colors duration-300 focus-within:border-ink">
              <Search className="h-[18px] w-[18px] shrink-0 text-taupe" strokeWidth={1.25} />
              <input
                id="catalog-search"
                type="search"
                value={search.q ?? ""}
                onChange={(event) => update({ q: event.target.value || undefined })}
                className="min-w-0 flex-1 appearance-none bg-transparent py-3 font-display text-2xl leading-none text-foreground outline-none placeholder:text-taupe/80 [&::-webkit-search-cancel-button]:hidden"
                placeholder="Найти изделие"
              />
              {search.q ? (
                <button
                  type="button"
                  onClick={() => update({ q: undefined })}
                  aria-label="Очистить поиск"
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-taupe transition-colors hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <X className="h-4 w-4" strokeWidth={1.25} />
                </button>
              ) : null}
            </div>
          </div>
          <Select
            label="Коллекция"
            value={search.collection}
            onChange={(value) => update({ collection: value || undefined })}
            options={collections.map((item) => [item.slug, item.name])}
          />
          <Select
            label="Категория"
            value={search.category}
            onChange={(value) => update({ category: value || undefined })}
            options={categories.map((item) => [item, item])}
          />
          <Select
            label="Цвет"
            value={search.color}
            onChange={(value) => update({ color: value || undefined })}
            options={colors.map((item) => [item.id, item.label])}
          />
          <Select
            label="Система"
            value={search.system}
            onChange={(value) =>
              update({ system: (value as CatalogSearch["system"]) || undefined })
            }
            options={[
              ["standard", "Standard"],
              ["smart", "NOIR SMART"],
            ]}
          />
          <button
            type="button"
            onClick={() => void navigate({ to: "/catalog", search: {} })}
            className="text-xs uppercase tracking-[0.16em] underline underline-offset-4"
          >
            Сбросить фильтры
          </button>
        </aside>
        <section>
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <p className="text-sm text-muted-foreground">Найдено: {result.length}</p>
            <Select
              label="Сортировка"
              value={search.sort}
              onChange={(value) => update({ sort: (value as CatalogSearch["sort"]) || undefined })}
              options={[
                ["popular", "Популярные"],
                ["new", "Новинки"],
                ["price-asc", "Сначала дешевле"],
                ["price-desc", "Сначала дороже"],
              ]}
            />
          </div>
          {result.length ? (
            <div className="mt-9 grid gap-x-5 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {result.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 3} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Ничего не найдено"
              description="Измените параметры поиска или сбросьте фильтры."
              action={{ label: "Показать весь каталог", to: "/catalog" }}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <label className="block text-sm">
      <span className="label-caps text-taupe">{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-hairline bg-background px-3 py-2"
      >
        <option value="">Все</option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
