import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { SlidersHorizontal, LayoutGrid, Rows3, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import {
  BODY_COLORS,
  CATALOG,
  CATEGORIES,
  CATEGORY_MAP,
  COLLECTIONS,
  COLLECTION_MAP,
  EMPTY_FILTERS,
  PRICE_BOUNDS,
  SIZE_MAP,
  SIZES,
  SORTS,
  applyFilters,
  minPrice,
  type CategoryId,
  type CollectionId,
  type Filters,
  type SortId,
} from "@/lib/catalog";
import type { ColorId, ShopSystem, SizeCode } from "@/lib/types";
import { formatPrice, plural } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { EmptyState } from "@/components/site/EmptyState";
import { JsonLd } from "@/components/site/JsonLd";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";

type CatalogSearch = {
  q?: string;
  collection?: CollectionId;
  category?: CategoryId;
  size?: SizeCode;
  color?: ColorId;
  system?: ShopSystem;
  min?: number;
  max?: number;
  sort?: SortId;
  view?: "grid" | "list";
};

const COLLECTION_IDS = COLLECTIONS.map((c) => c.id) as string[];
const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as string[];
const SIZE_CODES = SIZES.map((s) => s.code) as string[];
const COLOR_IDS = BODY_COLORS.map((c) => c.id) as string[];
const SORT_IDS = SORTS.map((s) => s.id) as string[];

function str(value: unknown, allowed: string[]): string | undefined {
  return typeof value === "string" && allowed.includes(value) ? value : undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value)))
    return Math.max(0, Math.round(Number(value)));
  return undefined;
}

export const Route = createFileRoute("/catalog")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    q: typeof search.q === "string" && search.q.trim() ? search.q.slice(0, 80) : undefined,
    collection: str(search.collection, COLLECTION_IDS) as CollectionId | undefined,
    category: str(search.category, CATEGORY_IDS) as CategoryId | undefined,
    size: str(search.size, SIZE_CODES) as SizeCode | undefined,
    color: str(search.color, COLOR_IDS) as ColorId | undefined,
    system: str(search.system, ["standard", "smart"]) as ShopSystem | undefined,
    min: num(search.min),
    max: num(search.max),
    sort: str(search.sort, SORT_IDS) as SortId | undefined,
    view: str(search.view, ["grid", "list"]) as "grid" | "list" | undefined,
  }),
  head: ({ search }: { search: CatalogSearch }) => {
    const collection = search.collection ? COLLECTION_MAP[search.collection] : undefined;
    const title = collection
      ? `${collection.name} ${collection.tagline} — купить в NOIR ATELIER`
      : "Каталог — кашпо, вазы и декор NOIR ATELIER";
    const description = collection
      ? `${collection.description} Изделия напечатаны в ${BRAND.country} под заказ: размеры S–XL, ${BODY_COLORS.length} цветов корпуса, системы Standard и Smart.`
      : `Каталог NOIR ATELIER: дизайнерские кашпо, вазы и декоративные объекты. Фильтры по коллекции, размеру, цвету и системе автополива. Производство в ${BRAND.country} под заказ.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CatalogPage,
});

function CatalogPage() {
  const search = useSearch({ from: "/catalog" });
  const navigate = useNavigate({ from: "/catalog" });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useMemo<Filters>(
    () => ({
      q: search.q ?? "",
      category: search.category ?? "all",
      collection: search.collection ?? "all",
      size: search.size ?? "all",
      color: search.color ?? "all",
      system: search.system ?? "all",
      min: search.min,
      max: search.max,
      sort: search.sort ?? "popular",
    }),
    [search],
  );

  const results = useMemo(() => applyFilters(CATALOG, filters), [filters]);
  const sort = SORTS.find((s) => s.id === filters.sort) ?? SORTS[0];
  const view = search.view ?? "grid";
  const activeCount = countActive(filters);

  const update = useCallback(
    (patch: Partial<CatalogSearch>, replace = false) => {
      void navigate({
        to: "/catalog",
        search: (prev: CatalogSearch) => ({ ...prev, ...patch }),
        replace,
      });
    },
    [navigate],
  );

  const reset = useCallback(() => {
    void navigate({ to: "/catalog", search: () => ({}) as CatalogSearch, replace: true });
  }, [navigate]);

  const filterPanel = (
    <FilterPanel
      filters={filters}
      onChange={(patch) => update(patch, true)}
      onReset={reset}
      activeCount={activeCount}
    />
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "/" },
            { "@type": "ListItem", position: 2, name: "Каталог", item: "/catalog" },
          ],
        }}
      />

      <div className="container-page pt-10 md:pt-14">
        <Breadcrumbs
          items={[
            { label: "Главная", to: "/" },
            { label: "Каталог" },
            ...(filters.collection !== "all"
              ? [{ label: COLLECTION_MAP[filters.collection].name }]
              : []),
          ]}
        />
        <div className="mt-6 border-b border-hairline pb-8">
          <p className="label-caps text-taupe">Каталог</p>
          <h1 className="display-lg mt-4 text-foreground">
            {filters.collection !== "all"
              ? `${COLLECTION_MAP[filters.collection].name} · ${COLLECTION_MAP[filters.collection].tagline}`
              : "Кашпо, вазы и объекты"}
          </h1>
          <p className="prose-noir mt-5">
            {filters.collection !== "all"
              ? COLLECTION_MAP[filters.collection].description
              : "Все изделия NOIR ATELIER собраны в шесть коллекций. В каталоге — модели, доступные для заказа: выбирайте размер, цвет корпуса и вставки, систему Standard или Smart."}
          </p>
        </div>
      </div>

      <div className="container-page py-10 md:py-14">
        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12">
          <aside className="hidden lg:block">{filterPanel}</aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
              <p className="text-sm text-muted-foreground">
                <span className="text-ink">{results.length}</span>{" "}
                {plural(results.length, "изделие", "изделия", "изделий")}
                {filters.q ? (
                  <>
                    {" "}
                    по запросу «{filters.q}»
                    <button
                      type="button"
                      onClick={() => update({ q: undefined })}
                      className="ml-2 inline-flex items-center gap-1 text-taupe underline underline-offset-4 hover:text-ink"
                    >
                      <X className="h-3 w-3" /> сбросить
                    </button>
                  </>
                ) : null}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex items-center gap-2 border border-hairline px-4 py-2 text-xs uppercase tracking-[0.16em] text-ink lg:hidden"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Фильтры{activeCount ? ` · ${activeCount}` : ""}
                </button>

                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">Сортировка</span>
                  <select
                    value={filters.sort}
                    onChange={(e) => update({ sort: e.target.value as SortId }, true)}
                    className="border border-hairline bg-transparent px-3 py-2 text-xs text-ink outline-none focus:border-ink"
                    aria-label="Сортировка товаров"
                  >
                    {SORTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex border border-hairline" role="group" aria-label="Вид каталога">
                  <ViewButton
                    active={view === "grid"}
                    label="Сетка"
                    onClick={() => update({ view: "grid" }, true)}
                  >
                    <LayoutGrid className="h-4 w-4" strokeWidth={1.25} />
                  </ViewButton>
                  <ViewButton
                    active={view === "list"}
                    label="Список"
                    onClick={() => update({ view: "list" }, true)}
                  >
                    <Rows3 className="h-4 w-4" strokeWidth={1.25} />
                  </ViewButton>
                </div>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="mt-10">
                <EmptyState
                  title="Ничего не нашлось"
                  description="Попробуйте снять часть фильтров или изменить запрос. Вся коллекция доступна в каталоге без фильтров."
                  action={{ label: "Сбросить фильтры", to: "/catalog" }}
                />
              </div>
            ) : view === "grid" ? (
              <ul className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((product, index) => (
                  <li key={product.id}>
                    <ProductCard product={product} priority={index < 4} />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-10 divide-y divide-hairline border-y border-hairline">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      to="/product/$slug"
                      params={{ slug: product.slug }}
                      className="group flex items-center gap-5 py-6 transition-colors hover:bg-secondary/40"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        width={1008}
                        height={1200}
                        className="h-28 w-24 shrink-0 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="label-caps text-taupe">
                          {COLLECTION_MAP[product.collection].name}
                        </p>
                        <h2 className="mt-1 font-display text-2xl text-foreground">{product.name}</h2>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {product.shortDescription}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {product.sizes
                            .map((s) => `${s} ${SIZE_MAP[s].dimensions_mm}`)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">от</p>
                        <p className="font-display text-2xl text-ink">
                          {formatPrice(minPrice(product))}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-12 text-xs text-muted-foreground">
              {sort.label} · показано {results.length} из {CATALOG.length}. Изделия печатаются под
              заказ; индивидуальные параметры — в разделе{" "}
              <Link to="/custom" className="text-ink underline underline-offset-4">
                Индивидуальный дизайн
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* mobile filters */}
      <DialogPrimitive.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex h-full w-[min(90vw,21rem)] flex-col border-r border-hairline bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <DialogPrimitive.Title className="label-caps text-ink">Фильтры</DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label="Закрыть фильтры"
                className="flex h-9 w-9 items-center justify-center text-ink-soft hover:text-foreground"
              >
                <X className="h-4 w-4" strokeWidth={1.25} />
              </DialogPrimitive.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">{filterPanel}</div>
            <div className="border-t border-hairline px-5 py-4">
              <DialogPrimitive.Close className="w-full bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground">
                Показать {results.length} {plural(results.length, "изделие", "изделия", "изделий")}
              </DialogPrimitive.Close>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-9 w-9 items-center justify-center transition-colors",
        active ? "bg-ink text-primary-foreground" : "text-taupe hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function countActive(filters: Filters): number {
  let n = 0;
  if (filters.category !== "all") n++;
  if (filters.collection !== "all") n++;
  if (filters.size !== "all") n++;
  if (filters.color !== "all") n++;
  if (filters.system !== "all") n++;
  if (filters.min !== undefined || filters.max !== undefined) n++;
  return n;
}

function FilterPanel({
  filters,
  onChange,
  onReset,
  activeCount,
}: {
  filters: Filters;
  onChange: (patch: Partial<CatalogSearch>) => void;
  onReset: () => void;
  activeCount: number;
}) {
  return (
    <div className="space-y-9">
      <div className="flex items-center justify-between">
        <p className="label-caps text-ink">Фильтры{activeCount ? ` · ${activeCount}` : ""}</p>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-taupe underline underline-offset-4 transition-colors hover:text-ink"
        >
          Сбросить
        </button>
      </div>

      <FilterGroup title="Категория">
        <RadioRow
          options={[
            { value: "all", label: "Все категории" },
            ...CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
          ]}
          value={filters.category}
          onSelect={(v) => onChange({ category: v === "all" ? undefined : (v as CategoryId) })}
        />
      </FilterGroup>

      <FilterGroup title="Коллекция">
        <RadioRow
          options={[
            { value: "all", label: "Все коллекции" },
            ...COLLECTIONS.map((c) => ({ value: c.id, label: `${c.name} ${c.tagline}` })),
          ]}
          value={filters.collection}
          onSelect={(v) => onChange({ collection: v === "all" ? undefined : (v as CollectionId) })}
        />
      </FilterGroup>

      <FilterGroup title="Размер">
        <div className="flex flex-wrap gap-2">
          <Chip active={filters.size === "all"} onClick={() => onChange({ size: undefined })}>
            Любой
          </Chip>
          {SIZES.map((s) => (
            <Chip
              key={s.code}
              active={filters.size === s.code}
              onClick={() => onChange({ size: filters.size === s.code ? undefined : s.code })}
              title={s.dimensions_mm}
            >
              {s.code}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Цвет корпуса">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onChange({ color: undefined })}
            className={cn(
              "h-7 rounded-full border px-3 text-[11px] uppercase tracking-[0.14em] transition-colors",
              filters.color === "all"
                ? "border-ink bg-ink text-primary-foreground"
                : "border-hairline text-taupe hover:border-ink hover:text-ink",
            )}
          >
            Все
          </button>
          {BODY_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              title={color.label}
              aria-label={color.label}
              aria-pressed={filters.color === color.id}
              onClick={() =>
                onChange({ color: filters.color === color.id ? undefined : color.id })
              }
              className={cn(
                "h-7 w-7 rounded-full border transition-all duration-300",
                color.swatchClass,
                filters.color === color.id
                  ? `ring-2 ${color.ringClass} ring-offset-2 ring-offset-background`
                  : "border-ink/15 hover:scale-110",
              )}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Система">
        <div className="flex flex-wrap gap-2">
          <Chip active={filters.system === "all"} onClick={() => onChange({ system: undefined })}>
            Любая
          </Chip>
          <Chip
            active={filters.system === "standard"}
            onClick={() =>
              onChange({ system: filters.system === "standard" ? undefined : "standard" })
            }
          >
            Standard
          </Chip>
          <Chip
            active={filters.system === "smart"}
            onClick={() => onChange({ system: filters.system === "smart" ? undefined : "smart" })}
          >
            Smart
          </Chip>
        </div>
      </FilterGroup>

      <FilterGroup title="Цена, ₽">
        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(PRICE_BOUNDS.min)}
            value={filters.min ?? ""}
            onChange={(e) =>
              onChange({ min: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            aria-label="Цена от"
            className="w-full border border-hairline bg-transparent px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
          <span className="text-taupe">—</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(PRICE_BOUNDS.max)}
            value={filters.max ?? ""}
            onChange={(e) =>
              onChange({ max: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            aria-label="Цена до"
            className="w-full border border-hairline bg-transparent px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
        </div>
      </FilterGroup>

      <div className="border-t border-hairline pt-6">
        <p className="label-caps text-taupe">Сейчас выбрано</p>
        <p className="mt-3 text-sm text-ink-soft">{describeFilters(filters)}</p>
      </div>
    </div>
  );
}

function describeFilters(filters: Filters): string {
  const parts: string[] = [];
  if (filters.category !== "all") parts.push(CATEGORY_MAP[filters.category].label);
  if (filters.collection !== "all") parts.push(COLLECTION_MAP[filters.collection].name);
  if (filters.size !== "all") parts.push(`размер ${filters.size}`);
  if (filters.color !== "all")
    parts.push(
      BODY_COLORS.find((c) => c.id === filters.color)?.label.toLowerCase() ?? filters.color,
    );
  if (filters.system === "standard") parts.push("система Standard");
  if (filters.system === "smart") parts.push("система Smart");
  if (filters.min !== undefined) parts.push(`от ${formatPrice(filters.min)}`);
  if (filters.max !== undefined) parts.push(`до ${formatPrice(filters.max)}`);
  return parts.length ? parts.join(", ") : "Без фильтров — показаны все изделия.";
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label-caps mb-4 text-taupe">{title}</p>
      {children}
    </div>
  );
}

function RadioRow({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <ul className="space-y-2.5">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <li key={option.value}>
            <button
              type="button"
              onClick={() => onSelect(option.value)}
              aria-pressed={active}
              className={cn(
                "text-left text-sm transition-colors duration-300",
                active ? "text-ink" : "text-muted-foreground hover:text-ink",
              )}
            >
              {active ? <span className="mr-2 text-taupe">—</span> : null}
              {option.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "min-w-9 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors duration-300",
        active
          ? "border-ink bg-ink text-primary-foreground"
          : "border-hairline text-taupe hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
