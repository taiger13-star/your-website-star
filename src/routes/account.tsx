import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";

import { ProductCard } from "@/components/product/ProductCard";
import {
  getAccountOrdersFn,
  getCurrentUserFn,
  logoutUserFn,
  updateProfileFn,
  uploadAvatarFn,
} from "@/lib/account-functions";
import { formatPrice } from "@/lib/format";
import { paymentStatusLabel } from "@/lib/order-payment";
import { useAccount } from "@/store/account";
import { useCatalog } from "@/store/catalog";
import { useWishlist } from "@/store/wishlist";

export const Route = createFileRoute("/account")({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) throw redirect({ to: "/login" });
    return user;
  },
  component: AccountPage,
});

type Tab = "profile" | "favorites" | "orders";
type AccountOrders = Awaited<ReturnType<typeof getAccountOrdersFn>>;
const orderStatusLabels: Record<AccountOrders[number]["status"], string> = {
  new: "Новый",
  in_progress: "В работе",
  awaiting_customer: "Ожидает ответа",
  ready: "Готов",
  completed: "Завершён",
  cancelled: "Отменён",
};

function AccountPage() {
  const loadedUser = Route.useLoaderData();
  const account = useAccount();
  const user = account.user ?? loadedUser;
  const { products } = useCatalog();
  const wishlist = useWishlist();
  const router = useRouter();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("profile");
  const [name, setName] = useState(user.name);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [orders, setOrders] = useState<AccountOrders | null>(null);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    setName(user.name);
  }, [user.name]);
  useEffect(() => {
    if (tab !== "orders" || orders) return;
    void getAccountOrdersFn()
      .then(setOrders)
      .catch((error) =>
        setOrdersError(error instanceof Error ? error.message : "Не удалось загрузить заказы."),
      );
  }, [tab, orders]);

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      await updateProfileFn({ data: { name } });
      await account.refresh();
      void router.invalidate();
      setMessage("Имя сохранено.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить имя.");
    } finally {
      setPending(false);
    }
  };
  const saveAvatar = async (file?: File) => {
    if (!file) return;
    setPending(true);
    setMessage("");
    try {
      const data = new FormData();
      data.append("file", file);
      await uploadAvatarFn({ data });
      await account.refresh();
      void router.invalidate();
      setMessage("Аватар обновлён.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить аватар.");
    } finally {
      setPending(false);
    }
  };
  const logout = async () => {
    await logoutUserFn();
    account.setUser(null);
    await navigate({ to: "/login" });
  };
  const favorites = products.filter((product) => wishlist.has(product.id));

  return (
    <div className="container-page py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-taupe">Аккаунт</p>
          <h1 className="display-lg mt-3">Личный кабинет</h1>
        </div>
        <button type="button" onClick={logout} className="text-sm underline">
          Выйти
        </button>
      </div>
      <nav
        className="mt-9 flex flex-wrap gap-2 border-b border-hairline pb-5"
        aria-label="Разделы личного кабинета"
      >
        {(
          [
            ["profile", "Профиль"],
            ["favorites", "Избранное"],
            ["orders", "Заказы"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            type="button"
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.14em] ${tab === id ? "bg-ink text-primary-foreground" : "border border-hairline"}`}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "profile" ? (
        <section className="mt-8 max-w-lg space-y-7">
          <div className="flex items-center gap-5">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Ваш аватар"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary font-display text-3xl">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <label className="cursor-pointer text-sm underline">
              Загрузить аватар
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={pending}
                onChange={(event) => void saveAvatar(event.target.files?.[0])}
              />
            </label>
          </div>
          <form onSubmit={saveName} className="space-y-5">
            <label className="block text-sm">
              Имя
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={160}
                required
                className="mt-2 w-full border border-hairline bg-background px-3 py-3"
              />
            </label>
            <label className="block text-sm">
              Почта
              <input
                value={user.email}
                readOnly
                className="mt-2 w-full border border-hairline bg-secondary px-3 py-3"
              />
            </label>
            <button
              disabled={pending}
              className="bg-ink px-5 py-3 text-xs uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
            >
              Сохранить имя
            </button>
          </form>
          {message ? (
            <p role="status" className="text-sm">
              {message}
            </p>
          ) : null}
        </section>
      ) : null}
      {tab === "favorites" ? (
        <section className="mt-8">
          {favorites.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {favorites.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-sm">
              Пока пусто.{" "}
              <Link to="/catalog" className="underline">
                Перейти в каталог
              </Link>
            </p>
          )}
        </section>
      ) : null}
      {tab === "orders" ? (
        <section className="mt-8 space-y-4">
          {ordersError ? <p role="alert">{ordersError}</p> : null}
          {!orders && !ordersError ? <p>Загружаем заказы…</p> : null}
          {orders?.length === 0 ? <p>Заказов пока нет.</p> : null}
          {orders?.map((order) => (
            <article key={order.id} className="border border-hairline p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="label-caps text-taupe">
                    <Link to="/order/$orderId" params={{ orderId: order.id }} className="underline">
                      Заказ №{order.number}
                    </Link>
                  </p>
                  <p className="mt-2 text-sm">
                    {new Date(order.createdAt).toLocaleDateString("ru-RU")} ·{" "}
                    {orderStatusLabels[order.status]}
                  </p>
                </div>
                <strong>
                  {formatPrice(order.grandTotal ?? order.total + (order.deliveryCost ?? 0))}
                </strong>
              </div>
              <ul className="mt-4 border-t border-hairline pt-3 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.productName} · {item.sizeCode} · {item.colorName} · {item.quantity} шт.
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-hairline pt-3 text-sm">
                <p>
                  Товары: {formatPrice(order.total)} ·{" "}
                  {paymentStatusLabel(
                    order.payments.find((payment) => payment.component === "product")?.status,
                  )}
                </p>
                <p className="mt-1">
                  Доставка: {order.deliveryCost == null ? "—" : formatPrice(order.deliveryCost)} ·{" "}
                  {paymentStatusLabel(
                    order.payments.find((payment) => payment.component === "delivery")?.status,
                  )}
                </p>
                <p className="mt-1">{order.cdekPointAddress ?? order.deliveryAddress ?? ""}</p>
                {order.cdekTrackingNumber ? (
                  <p className="mt-1">Отправление СДЭК: {order.cdekTrackingNumber}</p>
                ) : null}
                <Link
                  to="/order/$orderId"
                  params={{ orderId: order.id }}
                  className="mt-2 inline-block underline"
                >
                  Подробности заказа
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
