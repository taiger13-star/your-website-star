import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ctaStyles } from "@/components/site/Blocks";

export const Route = createFileRoute("/delivery")({
  component: DeliveryPage,
});

function DeliveryPage() {
  return (
    <div className="container-page pb-20 pt-10 md:pb-28 md:pt-14">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Доставка и получение" }]} />

      <header className="mt-8 max-w-4xl border-b border-hairline pb-10 md:mt-12 md:pb-14">
        <p className="label-caps text-taupe">Помощь с заказом</p>
        <h1 className="display-lg mt-5">Доставка и получение</h1>
        <p className="prose-noir mt-6 max-w-2xl">
          Доставляем заказы СДЭК в пункт выдачи или курьером. Способ, стоимость и ориентировочный
          срок вы увидите при оформлении, до подтверждения заказа.
        </p>
      </header>

      <section className="grid gap-10 border-b border-hairline py-12 lg:grid-cols-[16rem_1fr] lg:gap-16 md:py-16">
        <div>
          <p className="label-caps text-taupe">Порядок</p>
          <h2 className="display-md mt-3">Как это работает</h2>
        </div>
        <ol className="grid gap-8 sm:grid-cols-2">
          {[
            {
              number: "01",
              title: "Выберите город и способ",
              text: "Для получения в пункте выдачи выберите точку на карте. Для курьерской доставки укажите полный адрес.",
            },
            {
              number: "02",
              title: "Проверьте расчёт",
              text: "Стоимость и срок зависят от города, способа доставки и состава заказа. Они показываются перед оформлением.",
            },
            {
              number: "03",
              title: "Выберите оплату доставки",
              text: "Если вариант доступен для выбранного тарифа, доставку можно оплатить вместе с товаром или при получении. Суммы показаны отдельно.",
            },
            {
              number: "04",
              title: "Следите за отправлением",
              text: "После присвоения номера отправления он появится на странице заказа в личном кабинете.",
            },
          ].map((step) => (
            <li key={step.number} className="border-t border-hairline pt-5">
              <span className="label-caps text-taupe">{step.number}</span>
              <h3 className="mt-3 font-display text-2xl text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 border-b border-hairline py-12 md:grid-cols-2 md:py-16">
        <div>
          <p className="label-caps text-taupe">Передача в СДЭК</p>
          <h2 className="mt-3 font-display text-3xl text-foreground">Когда отправят заказ?</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Готовое оплаченное изделие передаём в СДЭК в течение 3 рабочих дней после подтверждения
            оплаты товара. Сроки индивидуальных проектов согласовываем отдельно.
          </p>
        </div>
        <div>
          <p className="label-caps text-taupe">Тестовый расчёт</p>
          <h2 className="mt-3 font-display text-3xl text-foreground">
            Что означает пометка «Тестовый»?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Если такая пометка появилась при оформлении, показанные стоимость и срок доставки нужно
            подтвердить перед отправкой. По вопросам расчёта свяжитесь с нами.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-5 pt-10">
        <Link to="/catalog" className={ctaStyles}>
          Перейти в каталог
        </Link>
        <Link to="/contacts" className="text-sm underline underline-offset-4">
          Задать вопрос о доставке
        </Link>
      </div>
    </div>
  );
}
