import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { JsonLd } from "@/components/site/JsonLd";
import { productSchema } from "@/lib/seo";
import { trackGoal } from "@/lib/analytics";
import { toast } from "sonner";

import { DimensionOverlay, ScaleReference } from "@/components/product/DimensionOverlay";
import { SmartComparison } from "@/components/product/SmartComparison";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { formatPrice } from "@/lib/format";
import { displaySize, formatSpecification, resolveSpecifications } from "@/lib/product-details";
import { getProductSmartPrices } from "@/lib/smart-comparison";
import { useCatalog } from "@/store/catalog";
import { useCart } from "@/store/cart";
import { useShopUI } from "@/store/ui";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    if (!parent.loaderData?.products.some((p) => p.slug === params.slug && p.variants.length))
      throw notFound();
  },
  remountDeps: ({ params }) => params.slug,
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { products } = useCatalog();
  const product = products.find((item) => item.slug === slug);
  const { add } = useCart();
  const { openCart } = useShopUI();
  const [variantId, setVariantId] = useState(product?.variants[0]?.id ?? "");
  const [colorId, setColorId] = useState(product?.colors[0]?.id ?? "");
  const [imageIndex, setImageIndex] = useState(0);
  const variant = useMemo(
    () => product?.variants.find((item) => item.id === variantId),
    [product, variantId],
  );
  if (!product || !variant)
    return (
      <div className="container-page py-24">
        <p>Товар не найден.</p>
        <Link to="/catalog" className="mt-5 inline-block underline">
          В каталог
        </Link>
      </div>
    );

  const selectedColor = product.colors.find((item) => item.id === colorId);
  const selectedSystem = variant.system;
  const systemVariants = product.variants.filter((item) => item.system === selectedSystem);
  const smartAvailable = product.variants.some((item) => item.system === "smart");
  const smartPrices = getProductSmartPrices(product, variant.sizeCode);
  const specifications = resolveSpecifications(product.detailSections, variant.id);
  const setSystem = (system: "standard" | "smart") => {
    const matchingSize = product.variants.find(
      (item) => item.system === system && item.sizeCode === variant.sizeCode,
    );
    setVariantId(
      matchingSize?.id ?? product.variants.find((item) => item.system === system)?.id ?? "",
    );
  };
  const addToCart = () => {
    if (!selectedColor) return;
    add({
      productId: product.id,
      variantId: variant.id,
      sku: product.sku,
      size: displaySize(variant.sizeLabel, variant.measurements),
      bodyColor: selectedColor.id,
      insertColor: selectedColor.id,
      system: variant.system,
      qty: 1,
      unitPrice: variant.price,
    });
    trackGoal("add_to_cart", {
      product_id: product.id,
      value: variant.price,
      currency: "RUB",
      quantity: 1,
    });
    toast.success("Товар добавлен в корзину");
    openCart();
  };

  return (
    <div className="container-page py-10 md:py-14">
      <JsonLd data={productSchema(product, variant)} />
      <Breadcrumbs
        items={[
          { label: "Главная", to: "/" },
          { label: "Каталог", to: "/catalog" },
          ...(product.collectionSlug
            ? [{ label: product.collectionName, to: `/collections/${product.collectionSlug}` }]
            : []),
          { label: product.name },
        ]}
      />
      <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,.92fr)] lg:items-start">
        <div className="lg:sticky lg:top-7">
          <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
            <img
              src={product.images[imageIndex] ?? product.images[0] ?? "/favicon.svg"}
              alt={`${product.name} — фото ${imageIndex + 1}`}
              width={1024}
              height={1280}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <DimensionOverlay sizeCode={variant.sizeLabel} measurements={variant.measurements} />
            <div className="absolute left-4 top-4 bg-ink/80 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-sand backdrop-blur-sm">
              {displaySize(variant.sizeLabel, variant.measurements)}
            </div>
          </div>
          {product.imageNotes?.[product.images[imageIndex] ?? product.images[0] ?? ""] ? (
            <p className="mt-3 border-l border-taupe pl-3 text-xs leading-relaxed text-muted-foreground">
              {product.imageNotes[product.images[imageIndex] ?? product.images[0] ?? ""]}
            </p>
          ) : null}
          {product.images.length > 1 ? (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`Показать фото ${index + 1}`}
                  aria-pressed={imageIndex === index}
                  className={`aspect-[4/5] overflow-hidden border ${imageIndex === index ? "border-ink" : "border-hairline"}`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <section>
          <p className="label-caps text-taupe">{product.collectionName}</p>
          <h1 className="display-lg mt-4">{product.name}</h1>
          <p className="prose-noir mt-5">{product.description}</p>
          {product.isComingSoon ? (
            <p className="mt-8 border border-hairline p-4 text-sm">
              Эта модель готовится к выпуску. Оформление заказа пока недоступно.
            </p>
          ) : (
            <>
              <fieldset className="mt-8">
                <legend className="label-caps text-taupe">Исполнение</legend>
                <div className={`mt-3 grid gap-2 ${smartAvailable ? "sm:grid-cols-2" : ""}`}>
                  <button
                    type="button"
                    aria-pressed={selectedSystem === "standard"}
                    onClick={() => setSystem("standard")}
                    className={`border p-4 text-left transition-colors ${selectedSystem === "standard" ? "border-ink bg-secondary" : "border-hairline hover:border-ink/50"}`}
                  >
                    <span className="label-caps text-taupe">Standard</span>
                    <span className="mt-2 block text-sm text-ink">
                      Дизайнерское кашпо с дренажом
                    </span>
                  </button>
                  {smartAvailable ? (
                    <button
                      type="button"
                      aria-pressed={selectedSystem === "smart"}
                      onClick={() => setSystem("smart")}
                      className={`border p-4 text-left transition-colors ${selectedSystem === "smart" ? "border-ink bg-ink text-sand" : "border-hairline hover:border-ink/50"}`}
                    >
                      <span
                        className={`label-caps ${selectedSystem === "smart" ? "text-sand" : "text-taupe"}`}
                      >
                        NOIR SMART
                      </span>
                      <span
                        className={`mt-2 block text-sm ${selectedSystem === "smart" ? "text-sand/80" : "text-ink"}`}
                      >
                        Вставка, резервуар и контроль воды
                      </span>
                    </button>
                  ) : null}
                </div>
                {smartAvailable ? (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Внешняя форма остаётся той же — меняется только внутренняя функциональная
                    система.
                  </p>
                ) : null}
              </fieldset>

              {smartAvailable ? (
                <div className="mt-5">
                  <SmartComparison prices={smartPrices} compact />
                  <Link
                    to="/smart"
                    className="mt-3 inline-block text-xs uppercase tracking-[0.14em] text-ink underline underline-offset-4"
                  >
                    Посмотреть, как работает NOIR SMART
                  </Link>
                </div>
              ) : null}

              <fieldset className="mt-6">
                <legend className="label-caps text-taupe">Размер</legend>
                <div className="mt-3 grid gap-2">
                  {systemVariants.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={variantId === item.id}
                      onClick={() => setVariantId(item.id)}
                      className={`grid gap-1 border p-4 text-left text-sm transition-colors sm:grid-cols-[1fr_auto] sm:items-center ${variantId === item.id ? "border-ink bg-secondary" : "border-hairline hover:border-ink/50"}`}
                    >
                      <span>{displaySize(item.sizeLabel, item.measurements)}</span>
                      <span className="text-ink-soft">
                        {formatPrice(item.price)} · {item.productionDays} дн.
                      </span>
                    </button>
                  ))}
                </div>
                <ScaleReference measurements={variant.measurements} />
              </fieldset>

              <fieldset className="mt-6">
                <legend className="label-caps text-taupe">Цвет корпуса</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <label
                      key={color.id}
                      className="cursor-pointer border border-hairline px-3 py-2 has-[:checked]:border-ink"
                    >
                      <input
                        type="radio"
                        name="body-color"
                        checked={colorId === color.id}
                        onChange={() => setColorId(color.id)}
                        className="mr-2"
                      />
                      {color.label}
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Внутреннее исполнение определяется выбранной системой. Отдельный выбор цвета
                  вставки появится в будущем конфигураторе.
                </p>
              </fieldset>
              <div className="mt-8 flex items-center justify-between border-t border-hairline pt-6">
                <div>
                  <p className="font-display text-3xl">{formatPrice(variant.price)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Изготавливается за {variant.productionDays} дн.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!selectedColor}
                  className="bg-ink px-7 py-4 text-xs uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
                >
                  В корзину
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {specifications.length ? (
        <section className="mt-16 border-t border-hairline pt-10 md:mt-24 md:pt-14">
          <p className="label-caps text-taupe">Подробности объекта</p>
          <h2 className="display-md mt-3">Характеристики</h2>
          <div className="mt-8 grid gap-7 lg:grid-cols-2">
            {specifications.map((section) => (
              <article
                key={section.id}
                className="border border-hairline bg-surface-raised p-5 md:p-7"
              >
                <h3 className="font-display text-3xl">{section.title}</h3>
                <dl className="mt-5 divide-y divide-hairline border-t border-hairline">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-3 text-sm"
                    >
                      <dt className="text-muted-foreground">{item.label}</dt>
                      <dd className="max-w-[16rem] text-right text-ink">
                        {formatSpecification(item)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
