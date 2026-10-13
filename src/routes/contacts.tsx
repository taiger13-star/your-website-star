import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CONTACT } from "@/lib/brand";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Контакты — NOIR ATELIER" },
      {
        name: "description",
        content: "Телефон, почта и реквизиты NOIR ATELIER для вопросов по заказам и проектам.",
      },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  return (
    <div className="container-page pb-20 pt-10 md:pb-28 md:pt-14">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Контакты" }]} />

      <header className="mt-8 max-w-4xl border-b border-hairline pb-10 md:mt-12 md:pb-14">
        <p className="label-caps text-taupe">Связаться с нами</p>
        <h1 className="display-lg mt-5">Контакты</h1>
        <p className="prose-noir mt-6 max-w-2xl">
          Поможем с выбором изделия, доставкой, заказом или возвратом. Для вопросов по уже
          оформленному заказу укажите его номер в сообщении.
        </p>
      </header>

      <section className="grid gap-8 border-b border-hairline py-12 md:grid-cols-2 md:py-16">
        <div className="border-t border-hairline pt-5">
          <p className="label-caps text-taupe">Электронная почта</p>
          <a
            href={`mailto:${CONTACT.email}`}
            className="mt-4 block break-all font-display text-3xl text-foreground underline decoration-hairline underline-offset-8 hover:decoration-foreground"
          >
            {CONTACT.email}
          </a>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Напишите по заказу, возврату или сотрудничеству. Для возврата укажите номер заказа или
            сведения, по которым его можно найти.
          </p>
        </div>
        <div className="border-t border-hairline pt-5">
          <p className="label-caps text-taupe">Телефон</p>
          <a
            href="tel:+79127137774"
            className="mt-4 block font-display text-3xl text-foreground underline decoration-hairline underline-offset-8 hover:decoration-foreground"
          >
            {CONTACT.phone}
          </a>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Позвоните, если удобнее обсудить вопрос голосом.
          </p>
        </div>
      </section>

      <section className="grid gap-10 border-b border-hairline py-12 lg:grid-cols-[16rem_1fr] lg:gap-16 md:py-16">
        <div>
          <p className="label-caps text-taupe">Для документов</p>
          <h2 className="display-md mt-3">Реквизиты</h2>
        </div>
        <dl className="grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-taupe">Продавец</dt>
            <dd className="mt-2 text-foreground">{CONTACT.seller}</dd>
          </div>
          <div>
            <dt className="text-taupe">ИНН</dt>
            <dd className="mt-2 text-foreground">{CONTACT.inn}</dd>
          </div>
          <div>
            <dt className="text-taupe">ОГРНИП</dt>
            <dd className="mt-2 text-foreground">{CONTACT.ogrnip}</dd>
          </div>
        </dl>
      </section>

      <nav className="flex flex-wrap gap-x-8 gap-y-4 pt-10 text-sm" aria-label="Разделы помощи">
        <Link to="/delivery" className="underline underline-offset-4">
          О доставке
        </Link>
        <Link to="/returns" className="underline underline-offset-4">
          О возврате
        </Link>
        <Link to="/business" hash="project-form" className="underline underline-offset-4">
          Обсудить проект
        </Link>
      </nav>
    </div>
  );
}
