import { createFileRoute, Link } from "@tanstack/react-router";

import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useCatalog } from "@/store/catalog";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items, subtotal, setQty, remove } = useCart();
  const { productById } = useCatalog();
  if (!items.length)
    return (
      <div className="container-page py-24 text-center">
        <h1 className="display-lg">Корзина пуста</h1>
        <Link to="/catalog" className="mt-8 inline-block underline">
          В каталог
        </Link>
      </div>
    );
  return (
    <div className="container-page py-10">
      <p className="label-caps text-taupe">Корзина</p>
      <h1 className="display-lg mt-4">Ваш заказ</h1>
      <div className="mt-8 max-w-2xl divide-y divide-hairline border-y border-hairline">
        {items.map((item) => (
          <article key={item.key} className="flex gap-4 py-5">
            <img
              src={productById(item.productId)?.images[0] ?? "/favicon.svg"}
              alt=""
              className="h-24 w-20 object-cover"
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl">
                {productById(item.productId)?.name ?? item.sku}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.size} · {item.system === "smart" ? "NOIR SMART" : "Standard"}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <button
                    onClick={() => setQty(item.key, item.qty - 1)}
                    className="border px-3 py-1"
                  >
                    −
                  </button>
                  <span className="px-3">{item.qty}</span>
                  <button
                    onClick={() => setQty(item.key, item.qty + 1)}
                    className="border px-3 py-1"
                  >
                    +
                  </button>
                </div>
                <strong>{formatPrice(item.unitPrice * item.qty)}</strong>
              </div>
              <button
                onClick={() => remove(item.key)}
                className="mt-2 text-xs text-destructive underline"
              >
                Удалить
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6 flex max-w-2xl justify-between text-xl">
        <span>Товары</span>
        <strong>{formatPrice(subtotal)}</strong>
      </div>
      <Link
        to="/checkout"
        className="mt-6 inline-block bg-ink px-7 py-4 text-xs uppercase tracking-[0.16em] text-primary-foreground"
      >
        Оформить заказ
      </Link>
    </div>
  );
}
