import { trackVerifiedPurchase } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import { getCurrentUserFn } from "@/lib/account-functions";
import { getOrderDetailsFn, mockPayOrderFn } from "@/lib/server-functions";
import { formatPrice } from "@/lib/format";
import { paymentStatusLabel } from "@/lib/order-payment";
import { useCart } from "@/store/cart";

export const Route = createFileRoute("/order/$orderId")({
  beforeLoad: async () => {
    if (!(await getCurrentUserFn())) throw redirect({ to: "/login" });
  },
  loader: async ({ params }) => getOrderDetailsFn({ data: { orderId: params.orderId } }),
  component: OrderPage,
});

function OrderPage() {
  const order = Route.useLoaderData();
  const router = useRouter();
  const { clear, hydrated, items: cartItems } = useCart();
  const [pending, setPending] = useState(false);
  const productPayment = order.payments.find((payment) => payment.component === "product");
  const deliveryPayment = order.payments.find((payment) => payment.component === "delivery");
  useEffect(() => {
    trackVerifiedPurchase(productPayment, { id: order.id, subtotal: order.total });
  }, [productPayment, order.id, order.total]);
  const cartSignature = cartItems
    .map((item) => `${item.productId}:${item.variantId}:${item.qty}`)
    .join("|");
  useEffect(() => {
    if (
      hydrated &&
      productPayment?.status === "mock_paid" &&
      sessionStorage.getItem("noir-pending-checkout-order") === order.id
    ) {
      if (sessionStorage.getItem("noir-pending-checkout-cart") === cartSignature) clear();
      sessionStorage.removeItem("noir-pending-checkout-order");
      sessionStorage.removeItem("noir-pending-checkout-cart");
    }
  }, [hydrated, productPayment?.status, order.id, clear, cartSignature]);
  const retryPayment = async () => {
    setPending(true);
    try {
      await mockPayOrderFn({ data: { orderId: order.id } });
      if (sessionStorage.getItem("noir-pending-checkout-order") === order.id) {
        if (sessionStorage.getItem("noir-pending-checkout-cart") === cartSignature) clear();
        sessionStorage.removeItem("noir-pending-checkout-order");
        sessionStorage.removeItem("noir-pending-checkout-cart");
      }
      await router.invalidate();
      toast.success("Тестовая оплата сохранена");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось повторить тестовую оплату.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="container-page max-w-4xl py-12 md:py-16">
      <p className="label-caps text-taupe">Ваш заказ</p>
      <h1 className="display-lg mt-3">Заказ №{order.number}</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        {new Date(order.createdAt).toLocaleDateString("ru-RU")} · {order.customerName} ·{" "}
        {order.phone}
        {order.email ? ` · ${order.email}` : ""}
      </p>
      <div className="mt-8 grid gap-4 border-y border-hairline py-6 text-sm">
        <p>
          Товар: <strong>{paymentStatusLabel(productPayment?.status)}</strong>
        </p>
        <p>
          Доставка: <strong>{paymentStatusLabel(deliveryPayment?.status)}</strong>
        </p>
        <p>
          Способ: {order.deliveryMethod === "cdek_pvz" ? "Пункт выдачи СДЭК" : "Курьер СДЭК"} ·{" "}
          {order.deliveryCityName ?? `город ${order.cdekCityCode ?? "—"}`}
        </p>
        <p>{order.cdekPointAddress ?? order.deliveryAddress ?? "Адрес доставки не указан"}</p>
        {order.cdekTariffName ? <p>Тариф: {order.cdekTariffName}</p> : null}
        {order.deliveryQuoteIsTest ? (
          <p>Расчёт доставки тестовый. Стоимость и срок нужно проверить перед отправкой.</p>
        ) : null}
        {order.cdekTrackingNumber ? (
          <p>
            Номер отправления СДЭК: <strong>{order.cdekTrackingNumber}</strong>
          </p>
        ) : null}
        {order.comment ? <p>Комментарий: {order.comment}</p> : null}
      </div>
      <section className="mt-8 border border-hairline p-6" aria-label="Расчёт заказа">
        <h2 className="font-display text-2xl">Расчёт заказа</h2>
        <ul className="mt-4 divide-y divide-hairline">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                {item.productName} · {item.sizeCode} · {item.system} · {item.colorName} ×{" "}
                {item.quantity}
              </span>
              <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-hairline pt-4 text-sm">
          <span>Товары</span>
          <strong>{formatPrice(order.total)}</strong>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span>Доставка</span>
          <strong>{order.deliveryCost == null ? "—" : formatPrice(order.deliveryCost)}</strong>
        </div>
        <div className="mt-4 flex justify-between border-t border-hairline pt-4">
          <span>Итого</span>
          <strong>
            {formatPrice(order.grandTotal ?? order.total + (order.deliveryCost ?? 0))}
          </strong>
        </div>
        {order.payNowTotal != null ? (
          <div className="mt-2 flex justify-between text-sm">
            <span>К оплате сейчас</span>
            <strong>{formatPrice(order.payNowTotal)}</strong>
          </div>
        ) : null}
        {order.deliveryPaymentMode === "on_receipt" ? (
          <div className="mt-2 flex justify-between text-sm">
            <span>Доставка при получении</span>
            <strong>{formatPrice(order.deliveryCost ?? 0)}</strong>
          </div>
        ) : null}
      </section>
      {productPayment?.status === "pending" ? (
        <button
          type="button"
          onClick={retryPayment}
          disabled={pending}
          className="mt-6 bg-ink px-7 py-4 text-xs uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Сохраняем…" : "Повторить тестовую оплату"}
        </button>
      ) : null}
      {productPayment?.status === "mock_paid" ? (
        <p className="mt-5 text-sm">Тестовая оплата сохранена. Деньги не списывались.</p>
      ) : null}
      <Link to="/account" className="mt-7 block text-sm underline">
        В личный кабинет
      </Link>
    </div>
  );
}
