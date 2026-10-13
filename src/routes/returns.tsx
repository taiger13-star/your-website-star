import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CONTACT } from "@/lib/brand";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Возврат товара — NOIR ATELIER" },
      {
        name: "description",
        content: "Сроки, порядок обращения и адрес для возврата заказа NOIR ATELIER.",
      },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <div className="container-page pb-20 pt-10 md:pb-28 md:pt-14">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Возврат" }]} />

      <header className="mt-8 max-w-4xl border-b border-hairline pb-10 md:mt-12 md:pb-14">
        <p className="label-caps text-taupe">Помощь с заказом</p>
        <h1 className="display-lg mt-5">Возврат товара</h1>
        <p className="prose-noir mt-6 max-w-2xl">
          Если изделие не подошло или вы обнаружили недостаток, напишите нам. Ниже — сроки, порядок
          обращения и адрес отправки.
        </p>
      </header>

      <section className="grid gap-10 border-b border-hairline py-12 lg:grid-cols-[16rem_1fr] lg:gap-16 md:py-16">
        <div>
          <p className="label-caps text-taupe">Сроки</p>
          <h2 className="display-md mt-3">Когда можно вернуть</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="border-t border-hairline pt-5">
            <h3 className="font-display text-2xl text-foreground">Товар надлежащего качества</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Отказаться от покупки можно в любое время до передачи товара и в течение 7 дней после
              получения. Если письменную информацию о порядке и сроках возврата не предоставили при
              доставке, срок составляет 3 месяца после получения.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Для возврата сохраняются товарный вид и потребительские свойства. Отсутствие чека само
              по себе не лишает права подтвердить покупку другими доказательствами.
            </p>
          </div>
          <div className="border-t border-hairline pt-5">
            <h3 className="font-display text-2xl text-foreground">Товар с недостатком</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Опишите проблему в письме; фотографии помогут разобраться быстрее. По требованию
              продавца товар с недостатком возвращается за его счёт. Если вы оплатили отправку,
              необходимые расходы возмещаются при подтверждении недостатка.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-10 border-b border-hairline py-12 lg:grid-cols-[16rem_1fr] lg:gap-16 md:py-16">
        <div>
          <p className="label-caps text-taupe">Обращение</p>
          <h2 className="display-md mt-3">Как оформить возврат</h2>
        </div>
        <div className="space-y-7 text-sm leading-relaxed text-ink-soft">
          <p>
            Напишите на{" "}
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-foreground underline underline-offset-4"
            >
              {CONTACT.email}
            </a>
            . Укажите номер заказа или другие сведения, по которым его можно найти, и сообщите,
            возвращаете ли вы качественный товар или обнаружили недостаток.
          </p>
          <div className="border border-hairline bg-surface p-6">
            <p className="label-caps text-taupe">Рекомендуемый адрес отправки</p>
            <p className="mt-3 text-foreground">
              ПВЗ СДЭК MSK2564, 115193, г. Москва, ул. 6-я Кожуховская, д. 18, корп. 2.
              <br />
              Получатель — Койков Алексей Анатольевич, тел. {CONTACT.phone}.
            </p>
          </div>
          <p>
            Вы можете использовать иной подходящий способ дистанционной передачи товара продавцу.
            При отказе от качественного товара обратную доставку оплачивает покупатель. Если её
            оплатил продавец, из возвращаемой суммы вычитаются только фактические расходы на
            доставку товара от покупателя продавцу.
          </p>
          <p>
            Деньги возвращаются не позднее 10 дней со дня предъявления требования в установленном
            порядке.
          </p>
        </div>
      </section>

      <section className="max-w-3xl pt-12">
        <h2 className="font-display text-3xl text-foreground">Индивидуальные изделия</h2>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Право на отказ от качественного товара с индивидуально определёнными свойствами может быть
          ограничено, только если им может пользоваться исключительно приобретший его покупатель.
          Сам по себе выбор стандартного цвета или размера такого ограничения не создаёт.
        </p>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">
          Полные условия покупки и возврата приведены в{" "}
          <Link to="/terms" className="text-foreground underline underline-offset-4">
            пользовательском соглашении
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
