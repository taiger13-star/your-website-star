import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { formatPrice } from "@/lib/format";
import { useCatalog } from "@/store/catalog";
import { useCart } from "@/store/cart";
import { useShopUI } from "@/store/ui";

export const Route = createFileRoute("/product/$slug")({ component: ProductPage });

function ProductPage() {
  const { slug } = Route.useParams();
  const { products } = useCatalog();
  const product = products.find((item) => item.slug === slug);
  const { add } = useCart();
  const { openCart } = useShopUI();
  const [variantId, setVariantId] = useState(product?.variants[0]?.id ?? "");
  const [colorId, setColorId] = useState(product?.colors[0]?.id ?? "");
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
      size: variant.sizeCode,
      bodyColor: selectedColor.id,
      insertColor: selectedColor.id,
      system: variant.system,
      qty: 1,
      unitPrice: variant.price,
    });
    toast.success("Товар добавлен в корзину");
    openCart();
  };
  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs
        items={[
          { label: "Главная", to: "/" },
          { label: "Каталог", to: "/catalog" },
          { label: product.name },
        ]}
      />
      <div className="mt-7 grid gap-10 lg:grid-cols-2">
        <div className="grid gap-3 sm:grid-cols-2">
          {product.images.map((image, index) => (
            <img
              key={image}
              src={image}
              alt={`${product.name} — фото ${index + 1}`}
              className="aspect-[4/5] w-full bg-secondary object-cover"
            />
          ))}
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
                <legend className="label-caps text-taupe">Исполнение одного дизайна</legend>
                <div className={`mt-3 grid gap-2 ${smartAvailable ? "sm:grid-cols-2" : ""}`}>
                  <button
                    type="button"
                    aria-pressed={selectedSystem === "standard"}
                    onClick={() => setSystem("standard")}
                    className={`border p-4 text-left transition-colors ${
                      selectedSystem === "standard"
                        ? "border-ink bg-secondary"
                        : "border-hairline hover:border-ink/50"
                    }`}
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
                      className={`border p-4 text-left transition-colors ${
                        selectedSystem === "smart"
                          ? "border-ink bg-ink text-sand"
                          : "border-hairline hover:border-ink/50"
                      }`}
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
              <fieldset className="mt-6">
                <legend className="label-caps text-taupe">Размер</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {systemVariants.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={variantId === item.id}
                      onClick={() => setVariantId(item.id)}
                      className={`flex items-center justify-between border p-3 text-left text-sm transition-colors ${
                        variantId === item.id
                          ? "border-ink bg-secondary"
                          : "border-hairline hover:border-ink/50"
                      }`}
                    >
                      <span>{item.sizeCode}</span>
                      <span className="text-ink-soft">
                        {formatPrice(item.price)} · {item.productionDays} дн.
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mt-6">
                <legend className="label-caps text-taupe">Цвет</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <label
                      key={color.id}
                      className="cursor-pointer border border-hairline px-3 py-2 has-[:checked]:border-ink"
                    >
                      <input
                        type="radio"
                        name="color"
                        checked={colorId === color.id}
                        onChange={() => setColorId(color.id)}
                        className="mr-2"
                      />
                      {color.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-8 flex items-center justify-between border-t border-hairline pt-6">
                <p className="font-display text-3xl">{formatPrice(variant.price)}</p>
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
    </div>
  );
}
