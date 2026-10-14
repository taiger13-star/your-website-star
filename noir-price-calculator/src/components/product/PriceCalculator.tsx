import { useEffect, useMemo, useState } from "react";

import { BODY_COLORS, CATALOG, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { CUSTOMER_MATERIALS, type CustomerMaterialId } from "@/lib/pricing";
import { calculateProductQuote } from "@/lib/pricing.functions";
import type { ColorId, ShopSystem, SizeCode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PriceCalculator({
  initialProductId,
  lockProduct = false,
  className,
}: {
  initialProductId?: string;
  lockProduct?: boolean;
  className?: string;
}) {
  const initialProduct = CATALOG.find((p) => p.id === initialProductId) ?? CATALOG[0];
  const [productId, setProductId] = useState(initialProduct?.id ?? "");
  const [size, setSize] = useState<SizeCode>(initialProduct?.sizes[0] ?? "S");
  const [system, setSystem] = useState<ShopSystem>("standard");
  const [material, setMaterial] = useState<CustomerMaterialId>(
    initialProduct?.material.includes("PETG") ? "PETG" : "PLA",
  );
  const [color, setColor] = useState<ColorId>(initialProduct?.colors[0] ?? "ivory");
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const product = useMemo<Product | undefined>(
    () => CATALOG.find((p) => p.id === productId),
    [productId],
  );

  useEffect(() => {
    if (!product) return;
    if (!product.sizes.includes(size)) setSize(product.sizes[0]);
    if (!product.colors.includes(color)) setColor(product.colors[0]);
    if (!product.smartAvailable && system === "smart") setSystem("standard");
  }, [product, size, color, system]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    calculateProductQuote({
      data: { productId: product.id, size, system, material, color },
    })
      .then((result) => {
        if (!cancelled) setPrice(result.price);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Не удалось рассчитать цену. Попробуйте ещё раз.");
          setPrice(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [product, size, system, material, color]);

  if (!product) return null;

  const availableColors = BODY_COLORS.filter((item) => product.colors.includes(item.id));

  return (
    <section className={cn("border border-hairline bg-background p-5 sm:p-7", className)}>
      <div className="grid gap-7 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          {!lockProduct ? (
            <label className="block">
              <span className="label-caps text-taupe">Изделие</span>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="mt-2 min-h-11 w-full border border-hairline bg-background px-3 text-sm text-foreground"
              >
                {CATALOG.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div>
            <p className="label-caps text-taupe">Размер</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSize(item)}
                  className={cn(
                    "min-h-11 min-w-14 border px-4 text-sm",
                    size === item
                      ? "border-ink bg-ink text-primary-foreground"
                      : "border-hairline bg-background text-ink",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {product.smartAvailable ? (
            <div>
              <p className="label-caps text-taupe">Система</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["standard", "smart"] as ShopSystem[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSystem(item)}
                    className={cn(
                      "min-h-11 border px-4 text-xs uppercase tracking-[0.12em]",
                      system === item
                        ? "border-ink bg-ink text-primary-foreground"
                        : "border-hairline bg-background text-ink",
                    )}
                  >
                    {item === "smart" ? "SMART" : "STANDARD"}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="label-caps text-taupe">Материал</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {CUSTOMER_MATERIALS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMaterial(item.id)}
                  className={cn(
                    "min-h-14 border px-4 py-3 text-left",
                    material === item.id
                      ? "border-ink bg-secondary"
                      : "border-hairline bg-background",
                  )}
                >
                  <span className="block text-sm font-medium text-foreground">{item.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label-caps text-taupe">Цвет</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {availableColors.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setColor(item.id)}
                  aria-label={item.label}
                  aria-pressed={color === item.id}
                  title={item.label}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border",
                    color === item.id ? "border-ink" : "border-hairline",
                  )}
                >
                  <span
                    className="h-8 w-8 rounded-full border border-black/10"
                    style={{ backgroundColor: item.mix }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="border-t border-hairline pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <p className="label-caps text-taupe">Ваш вариант</p>
          <h2 className="mt-3 font-display text-2xl text-foreground">{product.name}</h2>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Размер</dt>
              <dd>{size}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Материал</dt>
              <dd>{material}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Цвет</dt>
              <dd>{BODY_COLORS.find((i) => i.id === color)?.label}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Исполнение</dt>
              <dd>{system === "smart" ? "SMART" : "STANDARD"}</dd>
            </div>
          </dl>

          <div className="mt-8 border-t border-hairline pt-6" aria-live="polite">
            <p className="label-caps text-taupe">Стоимость</p>
            <p className="mt-2 font-display text-4xl text-foreground">
              {loading ? "Расчёт…" : price !== null ? formatPrice(price) : "—"}
            </p>
            {error ? (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Цена пересчитывается автоматически при изменении материала, цвета, размера или
                исполнения.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
