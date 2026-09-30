import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { createOrderFn } from "@/lib/server-functions";
import { formatPrice } from "@/lib/format";
import { useCatalog } from "@/store/catalog";
import { useCart } from "@/store/cart";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { productById } = useCatalog();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      const order = await createOrderFn({
        data: {
          customerName: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          email: String(form.get("email") ?? ""),
          deliveryMethod: String(form.get("deliveryMethod") ?? ""),
          deliveryAddress: String(form.get("address") ?? ""),
          comment: String(form.get("comment") ?? ""),
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            colorId: item.bodyColor,
            quantity: item.qty,
          })),
        },
      });
      clear();
      setDone(order.number);
      toast.success("Заявка отправлена");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось оформить заказ");
    } finally {
      setPending(false);
    }
  };
  if (done)
    return (
      <div className="container-page py-24 text-center">
        <p className="label-caps text-taupe">Заявка принята</p>
        <h1 className="display-lg mt-4">Заказ №{done}</h1>
        <p className="prose-noir mx-auto mt-5">
          Мы свяжемся с вами для подтверждения деталей и доставки.
        </p>
        <Link
          to="/catalog"
          className="mt-8 inline-block bg-ink px-7 py-4 text-xs uppercase tracking-[0.16em] text-primary-foreground"
        >
          Продолжить покупки
        </Link>
      </div>
    );
  if (!items.length)
    return (
      <div className="container-page py-24 text-center">
        <h1 className="display-lg">Корзина пуста</h1>
        <Link to="/catalog" className="mt-8 inline-block underline">
          Перейти в каталог
        </Link>
      </div>
    );
  return (
    <div className="container-page py-10 md:py-14">
      <p className="label-caps text-taupe">Оформление</p>
      <h1 className="display-lg mt-4">Оставить заявку</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <form onSubmit={submit} className="grid gap-5">
          <Input label="Имя" name="name" required />
          <Input label="Телефон" name="phone" required type="tel" />
          <Input label="Email" name="email" type="email" />
          <Input
            label="Способ доставки"
            name="deliveryMethod"
            required
            placeholder="Курьер, самовывоз…"
          />
          <label className="text-sm">
            Адрес доставки
            <textarea
              name="address"
              className="mt-2 min-h-24 w-full border border-hairline bg-background p-3"
            />
          </label>
          <label className="text-sm">
            Комментарий
            <textarea
              name="comment"
              className="mt-2 min-h-24 w-full border border-hairline bg-background p-3"
            />
          </label>
          <button
            disabled={pending}
            className="bg-ink px-7 py-4 text-xs uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
          >
            {pending ? "Отправляем…" : "Отправить заявку"}
          </button>
        </form>
        <aside className="h-fit border border-hairline p-6">
          <p className="label-caps text-taupe">Ваш заказ</p>
          <ul className="mt-4 divide-y divide-hairline">
            {items.map((item) => {
              const product = productById(item.productId);
              return (
                <li key={item.key} className="py-3 text-sm">
                  <p>
                    {product?.name ?? item.sku} × {item.qty}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {item.size} · {item.system === "smart" ? "NOIR SMART" : "Standard"}
                  </p>
                  <p className="mt-1">{formatPrice(item.unitPrice * item.qty)}</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex justify-between border-t border-hairline pt-4">
            <span>Товары</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Доставку и финальный срок подтвердит менеджер.
          </p>
        </aside>
      </div>
    </div>
  );
}
function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="text-sm">
      {label}
      <input {...props} className="mt-2 w-full border border-hairline bg-background px-3 py-2.5" />
    </label>
  );
}
