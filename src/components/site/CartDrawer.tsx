import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, X } from "lucide-react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

import { getCollection, getProductById } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useCart, type CartItem } from "@/store/cart";
import { useShopUI } from "@/store/ui";
import { COLOR_MAP } from "@/lib/catalog";

function VariantLine({ item }: { item: CartItem }) {
  const parts = [
    `Размер ${item.size}`,
    COLOR_MAP[item.bodyColor]?.label ?? item.bodyColor,
    item.system === "smart" ? "Smart" : "Standard",
  ];
  return <p className="mt-1 text-xs text-muted-foreground">{parts.join(" · ")}</p>;
}

export function CartDrawer() {
  const { items, subtotal, count, setQty, remove, clear, hydrated } = useCart();
  const { cartOpen, closeCart, openCart } = useShopUI();

  return (
    <SheetPrimitive.Root
      open={cartOpen}
      onOpenChange={(open) => {
        if (!open) closeCart();
        else openCart();
      }}
    >
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <SheetPrimitive.Content
          side="right"
          className="fixed inset-y-0 right-0 z-50 flex h-full w-[min(92vw,26rem)] flex-col border-l border-hairline bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        >
          <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
            <SheetPrimitive.Title className="label-caps text-ink">
              Корзина{count ? ` · ${count}` : ""}
            </SheetPrimitive.Title>
            <SheetPrimitive.Close
              aria-label="Закрыть корзину"
              className="flex h-9 w-9 items-center justify-center text-ink-soft transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" strokeWidth={1.25} />
            </SheetPrimitive.Close>
          </div>

          {hydrated && items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
              <p className="display-md text-foreground">Корзина пуста</p>
              <p className="text-sm text-muted-foreground">
                Выберите изделие в каталоге — размер, цвет и систему можно настроить в карточке
                товара.
              </p>
              <SheetPrimitive.Description asChild>
                <Link
                  to="/catalog"
                  onClick={closeCart}
                  className="bg-ink px-7 py-3 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-85"
                >
                  В каталог
                </Link>
              </SheetPrimitive.Description>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-hairline overflow-y-auto">
                {items.map((item) => {
                  const product = getProductById(item.productId);
                  if (!product) return null;
                  return (
                    <li key={item.key} className="flex gap-4 px-6 py-5">
                      <Link
                        to="/product/$slug"
                        params={{ slug: product.slug }}
                        onClick={closeCart}
                        className="h-24 w-20 shrink-0 overflow-hidden bg-secondary"
                      >
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                          width={1008}
                          height={1200}
                          className="h-full w-full object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="label-caps text-taupe">
                          {getCollection(product.collection)?.name}
                        </p>
                        <p className="mt-1 truncate font-display text-lg text-foreground">
                          {product.name}
                        </p>
                        <VariantLine item={item} />
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center border border-hairline">
                            <button
                              type="button"
                              onClick={() => setQty(item.key, item.qty - 1)}
                              aria-label="Уменьшить количество"
                              className="flex h-8 w-8 items-center justify-center text-ink-soft hover:text-ink"
                            >
                              <Minus className="h-3 w-3" strokeWidth={1.5} />
                            </button>
                            <span className="w-8 text-center text-sm tabular-nums">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => setQty(item.key, item.qty + 1)}
                              aria-label="Увеличить количество"
                              className="flex h-8 w-8 items-center justify-center text-ink-soft hover:text-ink"
                            >
                              <Plus className="h-3 w-3" strokeWidth={1.5} />
                            </button>
                          </div>
                          <p className="text-sm text-ink">{formatPrice(item.qty * item.unitPrice)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.key)}
                        aria-label={`Удалить ${product.name} из корзины`}
                        className="h-8 w-8 shrink-0 text-taupe transition-colors hover:text-ink"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.25} />
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-hairline px-6 py-5">
                <div className="flex items-baseline justify-between">
                  <span className="label-caps text-taupe">Товары</span>
                  <span className="font-display text-2xl text-foreground">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Стоимость доставки рассчитывается при подтверждении заказа.
                </p>
                <SheetPrimitive.Description asChild>
                  <Link
                    to="/checkout"
                    onClick={closeCart}
                    className="mt-5 flex w-full items-center justify-center bg-ink px-6 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-85"
                  >
                    Оформить заказ
                  </Link>
                </SheetPrimitive.Description>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <Link
                    to="/cart"
                    onClick={closeCart}
                    className="text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
                  >
                    Открыть корзину
                  </Link>
                  <button
                    type="button"
                    onClick={clear}
                    className="text-taupe underline underline-offset-4 transition-colors hover:text-ink"
                  >
                    Очистить
                  </button>
                </div>
              </div>
            </>
          )}
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
