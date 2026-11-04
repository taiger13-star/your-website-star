import { trackGoal } from "@/lib/analytics";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { CdekPickupMap } from "@/components/delivery/CdekPickupMap";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getCurrentUserFn } from "@/lib/account-functions";
import {
  calculateCdekDeliveryFn,
  createOrderFn,
  findCdekCitiesFn,
  findCdekPickupPointsFn,
  mockPayOrderFn,
} from "@/lib/server-functions";
import { formatPrice } from "@/lib/format";
import type { CdekCity, CdekDeliveryQuote, CdekPickupPoint } from "@/server/cdek-service";
import { useCatalog } from "@/store/catalog";
import { useCart } from "@/store/cart";

export const Route = createFileRoute("/checkout")({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) throw redirect({ to: "/login", search: { next: "/checkout" } });
    return user;
  },
  component: CheckoutPage,
});

type DeliveryMethod = "cdek_pvz" | "cdek_courier";

function CheckoutPage() {
  const { items, clear } = useCart();
  const user = Route.useLoaderData();
  const navigate = useNavigate();
  const { productById } = useCatalog();
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (items.length && !checkoutTracked.current) {
      trackGoal("begin_checkout", {
        value: items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
        currency: "RUB",
      });
      checkoutTracked.current = true;
    }
  }, [items]);
  const [pending, setPending] = useState(false);
  const [checkoutKey, setCheckoutKey] = useState(() => crypto.randomUUID());
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [serverPrices, setServerPrices] = useState<Record<string, number>>({});
  const [needsReconfirm, setNeedsReconfirm] = useState(false);
  const [deliveryPaymentMode, setDeliveryPaymentMode] = useState<"prepaid" | "on_receipt">(
    "prepaid",
  );
  const [method, setMethod] = useState<DeliveryMethod>("cdek_pvz");
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<CdekCity[]>([]);
  const [citySearched, setCitySearched] = useState(false);
  const [city, setCity] = useState<CdekCity | null>(null);
  const [cityPending, setCityPending] = useState(false);
  const [points, setPoints] = useState<CdekPickupPoint[]>([]);
  const [pointsPending, setPointsPending] = useState(false);
  const [pickupPoint, setPickupPoint] = useState<CdekPickupPoint | null>(null);
  const [courierAddress, setCourierAddress] = useState("");
  const [quote, setQuote] = useState<CdekDeliveryQuote | null>(null);
  const [quotePending, setQuotePending] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const cartForDelivery = items.map(({ productId, variantId, qty }) => ({
    productId,
    variantId,
    quantity: qty,
  }));
  const cartSignature = cartForDelivery
    .map((item) => `${item.productId}:${item.variantId}:${item.quantity}`)
    .join("|");

  useEffect(() => {
    setQuote(null);
    setServerPrices({});
    setCheckoutKey(crypto.randomUUID());
  }, [cartSignature]);
  useEffect(() => {
    const pendingOrder = sessionStorage.getItem("noir-pending-checkout-order");
    if (pendingOrder) void navigate({ to: "/order/$orderId", params: { orderId: pendingOrder } });
  }, [navigate]);

  const itemPrice = (item: (typeof items)[number]) =>
    serverPrices[`${item.productId}:${item.variantId}:${item.bodyColor}`] ?? item.unitPrice;
  const displayedSubtotal = items.reduce((sum, item) => sum + itemPrice(item) * item.qty, 0);
  const payNow = displayedSubtotal + (deliveryPaymentMode === "prepaid" ? (quote?.cost ?? 0) : 0);
  const payOnReceipt = deliveryPaymentMode === "on_receipt" ? (quote?.cost ?? 0) : 0;

  const clearDeliverySelection = () => {
    setPickupPoint(null);
    setPoints([]);
    setQuote(null);
    setCheckoutKey(crypto.randomUUID());
  };

  const selectCity = (nextCity: CdekCity) => {
    setCity(nextCity);
    setCityQuery(nextCity.name);
    setCities([]);
    setCitySearched(false);
    clearDeliverySelection();
  };

  const findCity = async () => {
    if (cityQuery.trim().length < 2) {
      toast.error("Введите минимум две буквы города.");
      return;
    }
    setCityPending(true);
    setCitySearched(false);
    try {
      const results = await findCdekCitiesFn({ data: { query: cityQuery.trim() } });
      const exactMatches = results.filter(
        (result) =>
          result.name.toLocaleLowerCase("ru-RU") === cityQuery.trim().toLocaleLowerCase("ru-RU"),
      );
      const [exactCity] = exactMatches;
      if (exactMatches.length === 1 && exactCity) {
        selectCity(exactCity);
      } else {
        setCities(results);
        setCitySearched(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось найти город.");
    } finally {
      setCityPending(false);
    }
  };

  const openMap = async () => {
    if (!city) {
      toast.error("Сначала выберите город.");
      return;
    }
    setPointsPending(true);
    try {
      const availablePoints = await findCdekPickupPointsFn({ data: { cityCode: city.code } });
      if (!availablePoints.length) throw new Error("В этом городе нет доступных пунктов СДЭК.");
      setPoints(availablePoints);
      setMapOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить пункты выдачи.");
    } finally {
      setPointsPending(false);
    }
  };

  const calculate = async (
    nextMethod = method,
    nextPickupPoint = pickupPoint,
    nextAddress = courierAddress,
  ) => {
    if (!city) return toast.error("Выберите город.");
    if (nextMethod === "cdek_pvz" && !nextPickupPoint)
      return toast.error("Выберите пункт СДЭК на карте.");
    if (nextMethod === "cdek_courier" && nextAddress.trim().length < 5)
      return toast.error("Укажите полный адрес для доставки курьером.");
    setQuotePending(true);
    try {
      const nextQuote = await calculateCdekDeliveryFn({
        data: {
          method: nextMethod,
          cityCode: city.code,
          pickupPointCode: nextPickupPoint?.code,
          deliveryAddress: nextMethod === "cdek_courier" ? nextAddress.trim() : undefined,
          items: cartForDelivery,
        },
      });
      setQuote(nextQuote);
      return nextQuote;
    } catch (error) {
      setQuote(null);
      toast.error(error instanceof Error ? error.message : "Не удалось рассчитать доставку.");
      return null;
    } finally {
      setQuotePending(false);
    }
  };

  const choosePickupPoint = (point: CdekPickupPoint) => {
    setPickupPoint(point);
    setQuote(null);
    setCheckoutKey(crypto.randomUUID());
    setMapOpen(false);
    void calculate("cdek_pvz", point);
  };

  const changeMethod = (nextMethod: DeliveryMethod) => {
    setMethod(nextMethod);
    setQuote(null);
    setPickupPoint(null);
    setCheckoutKey(crypto.randomUUID());
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!city) {
      toast.error("Выберите город доставки.");
      return;
    }
    if (method === "cdek_pvz" && !pickupPoint) {
      toast.error("Выберите пункт СДЭК на карте.");
      return;
    }
    if (method === "cdek_courier" && courierAddress.trim().length < 5) {
      toast.error("Укажите полный адрес для доставки курьером.");
      return;
    }
    if (!quote) {
      toast.error("Рассчитайте стоимость доставки перед оформлением.");
      return;
    }
    setPending(true);
    let savedOrderId = createdOrderId;
    try {
      if (createdOrderId) {
        await mockPayOrderFn({ data: { orderId: createdOrderId } });
        clear();
        await navigate({ to: "/order/$orderId", params: { orderId: createdOrderId } });
        return;
      }
      const result = await createOrderFn({
        data: {
          checkoutKey,
          customerName: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          email: String(form.get("email") ?? ""),
          deliveryPaymentMode,
          expectedSubtotal: displayedSubtotal,
          expectedDeliveryCost: quote.cost,
          expectedTariffCode: quote.tariffCode,
          expectedCurrency: quote.currency,
          delivery: {
            method,
            cityCode: city.code,
            cityName: city.name,
            pickupPointCode: pickupPoint?.code,
            deliveryAddress: method === "cdek_courier" ? courierAddress.trim() : undefined,
          },
          comment: String(form.get("comment") ?? ""),
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            colorId: item.bodyColor,
            quantity: item.qty,
          })),
        },
      });
      if (result.kind === "changed") {
        setQuote(result.delivery);
        setServerPrices(
          Object.fromEntries(
            result.itemPrices.map((item) => [
              `${item.productId}:${item.variantId}:${item.colorId}`,
              item.unitPrice,
            ]),
          ),
        );
        setNeedsReconfirm(true);
        toast.error("Сумма заказа изменилась. Проверьте расчёт и нажмите «Оплатить» ещё раз.");
        return;
      }
      const order = result.order;
      trackGoal("order_created", { order_id: order.id });
      savedOrderId = order.id;
      setCreatedOrderId(order.id);
      sessionStorage.setItem("noir-pending-checkout-order", order.id);
      sessionStorage.setItem("noir-pending-checkout-cart", cartSignature);
      await mockPayOrderFn({ data: { orderId: order.id } });
      sessionStorage.removeItem("noir-pending-checkout-order");
      sessionStorage.removeItem("noir-pending-checkout-cart");
      clear();
      await navigate({ to: "/order/$orderId", params: { orderId: order.id } });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось оформить заказ. Повторите попытку.",
      );
      if (savedOrderId) {
        await navigate({ to: "/order/$orderId", params: { orderId: savedOrderId } });
      }
    } finally {
      setPending(false);
    }
  };

  if (!items.length)
    return (
      <div className="container-page py-24 text-center">
        <h1 className="display-lg">Корзина пуста</h1>
        <Link to="/catalog" className="mt-8 inline-block underline">
          Перейти в каталог
        </Link>
      </div>
    );
  const total = displayedSubtotal + (quote?.cost ?? 0);
  return (
    <div className="container-page py-10 md:py-14">
      <p className="label-caps text-taupe">Оформление</p>
      <h1 className="display-lg mt-4">Доставка СДЭК</h1>
      <div className="mt-10 max-w-3xl">
        <form id="checkout-form" onSubmit={submit} className="grid gap-5">
          <Input label="Имя" name="name" defaultValue={user.name} required />
          <Input label="Телефон" name="phone" required type="tel" />
          <Input label="Email" name="email" defaultValue={user.email} type="email" />
          <fieldset className="border-y border-hairline py-5">
            <legend className="text-sm">Способ доставки</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <DeliveryMethodButton
                active={method === "cdek_pvz"}
                onClick={() => changeMethod("cdek_pvz")}
                title="Пункт выдачи СДЭК"
                note="Выберите точку на карте"
              />
              <DeliveryMethodButton
                active={method === "cdek_courier"}
                onClick={() => changeMethod("cdek_courier")}
                title="Курьер СДЭК"
                note="Доставка до двери"
              />
            </div>
            <div className="mt-5">
              <label htmlFor="cdek-city" className="text-sm">
                Город
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="cdek-city"
                  value={cityQuery}
                  onChange={(event) => {
                    setCityQuery(event.target.value);
                    setCity(null);
                    setCities([]);
                    setCitySearched(false);
                    clearDeliverySelection();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void findCity();
                    }
                  }}
                  placeholder="Начните вводить город"
                  className="min-w-0 flex-1 border border-hairline bg-background px-3 py-2.5"
                />
                <button
                  type="button"
                  onClick={() => void findCity()}
                  disabled={cityPending}
                  className="border border-ink px-4 text-xs uppercase tracking-[0.12em] disabled:opacity-50"
                >
                  {cityPending ? "Поиск…" : "Найти"}
                </button>
              </div>
              {cities.length ? (
                <div className="mt-2 border border-hairline">
                  {cities.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => selectCity(item)}
                      className="block w-full border-b border-hairline px-3 py-2 text-left text-sm last:border-0 hover:bg-surface"
                    >
                      {item.name}
                      {item.region ? `, ${item.region}` : ""}
                    </button>
                  ))}
                </div>
              ) : citySearched ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Город не найден. Проверьте название или попробуйте другой город.
                </p>
              ) : null}
              {cities.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Выберите город из списка, затем откройте карту пунктов выдачи.
                </p>
              ) : null}
            </div>
            {method === "cdek_pvz" ? (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => void openMap()}
                  disabled={!city || pointsPending}
                  className="border border-ink px-5 py-3 text-xs uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pointsPending ? "Загружаем карту…" : "Выбрать пункт на карте"}
                </button>
                {pickupPoint ? (
                  <p className="mt-3 text-sm">
                    Выбран пункт СДЭК:{" "}
                    <span className="text-muted-foreground">{pickupPoint.address}</span>
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-5">
                <label className="text-sm">
                  Адрес доставки
                  <textarea
                    value={courierAddress}
                    onChange={(event) => {
                      setCourierAddress(event.target.value);
                      setQuote(null);
                      setCheckoutKey(crypto.randomUUID());
                    }}
                    placeholder="Улица, дом, квартира или офис"
                    className="mt-2 min-h-24 w-full border border-hairline bg-background p-3"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void calculate()}
                  disabled={!city || quotePending}
                  className="mt-3 border border-ink px-5 py-3 text-xs uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {quotePending ? "Рассчитываем…" : "Рассчитать доставку"}
                </button>
              </div>
            )}
            {quote ? (
              <div className="mt-5 border-t border-hairline pt-4 text-sm">
                <p>
                  СДЭК: <strong>{formatPrice(quote.cost)}</strong>
                  {quote.periodMin !== null || quote.periodMax !== null
                    ? ` · ${quote.periodMin ?? quote.periodMax}–${quote.periodMax ?? quote.periodMin} дн.`
                    : ""}
                </p>
                {quote.isTest ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Тестовый расчёт: цену и срок подтвердим после оформления.
                  </p>
                ) : null}
              </div>
            ) : null}
          </fieldset>
          <fieldset className="border-b border-hairline pb-5">
            <legend className="text-sm">Оплата доставки</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <DeliveryMethodButton
                active={deliveryPaymentMode === "prepaid"}
                onClick={() => {
                  setDeliveryPaymentMode("prepaid");
                  setCheckoutKey(crypto.randomUUID());
                }}
                title="Сейчас вместе с товаром"
                note="Товар и доставка в одном тестовом платеже"
              />
              <DeliveryMethodButton
                active={deliveryPaymentMode === "on_receipt"}
                onClick={() => {
                  setDeliveryPaymentMode("on_receipt");
                  setCheckoutKey(crypto.randomUUID());
                }}
                title="При получении"
                note="Сейчас оплачивается только товар"
              />
            </div>
          </fieldset>
          <label className="text-sm">
            Комментарий
            <textarea
              name="comment"
              className="mt-2 min-h-24 w-full border border-hairline bg-background p-3"
            />
          </label>
        </form>
        <aside className="mt-8 border border-hairline p-6" aria-label="Расчёт заказа">
          <p className="label-caps text-taupe">Расчёт заказа</p>
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
                  <p className="mt-1">{formatPrice(itemPrice(item) * item.qty)}</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex justify-between border-t border-hairline pt-4">
            <span>Товары</span>
            <strong>{formatPrice(displayedSubtotal)}</strong>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span>Доставка</span>
            <strong>{quote ? formatPrice(quote.cost) : "—"}</strong>
          </div>
          <div className="mt-4 flex justify-between border-t border-hairline pt-4">
            <span>Итого</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <span>
              К оплате сейчас · товар{deliveryPaymentMode === "prepaid" ? " и доставка" : ""}
            </span>
            <strong>{formatPrice(payNow)}</strong>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span>Доставка при получении</span>
            <strong>{formatPrice(payOnReceipt)}</strong>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Оплата тестовая: деньги не списываются.
          </p>
          {needsReconfirm ? (
            <p role="alert" className="mt-3 text-sm">
              Сумма обновлена. Проверьте расчёт перед оплатой.
            </p>
          ) : null}
          <button
            type="submit"
            form="checkout-form"
            disabled={pending || !quote}
            className="mt-5 bg-ink px-7 py-4 text-xs uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
          >
            {pending ? "Сохраняем…" : "Оплатить (тест)"}
          </button>
          {!quote ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Для оплаты выберите город и способ получения, затем дождитесь расчёта доставки.
            </p>
          ) : null}
          {createdOrderId ? (
            <p className="mt-3 text-sm">
              Заказ сохранён.{" "}
              <Link to="/order/$orderId" params={{ orderId: createdOrderId }} className="underline">
                Открыть заказ
              </Link>
            </p>
          ) : null}
        </aside>
      </div>
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-5xl gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Выберите пункт выдачи СДЭК на карте</DialogTitle>
          <CdekPickupMap
            points={points}
            {...(pickupPoint ? { selectedCode: pickupPoint.code } : {})}
            onSelect={choosePickupPoint}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeliveryMethodButton({
  active,
  title,
  note,
  onClick,
}: {
  active: boolean;
  title: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border p-4 text-left ${active ? "border-ink bg-ink text-primary-foreground" : "border-hairline"}`}
    >
      <strong className="block text-sm">{title}</strong>
      <span className={`mt-1 block text-xs ${active ? "text-sand/70" : "text-muted-foreground"}`}>
        {note}
      </span>
    </button>
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
