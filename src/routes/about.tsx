import { createFileRoute, Link } from "@tanstack/react-router";

import atelierImg from "@/assets/atelier.jpg";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ctaStyles } from "@/components/site/Blocks";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "О бренде — NOIR ATELIER" },
      {
        name: "description",
        content:
          "NOIR ATELIER — предметы интерьера, созданные через цифровое моделирование и аддитивное производство.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <div className="container-page pt-10 md:pt-14">
        <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "О бренде" }]} />
        <div className="mt-6 grid gap-10 border-b border-hairline pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="label-caps text-taupe">NOIR ATELIER</p>
            <h1 className="display-lg mt-4">Дизайн, который появляется по запросу</h1>
            <p className="prose-noir mt-6">
              NOIR ATELIER — бренд дизайнерских предметов интерьера, созданных с помощью цифрового
              моделирования и аддитивного производства. Мы не заполняем склад одинаковыми вещами:
              изделие начинается с выбранной формы, размера, цвета и задачи конкретного
              пространства.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-7 border-t border-hairline pt-7 lg:border-t-0 lg:pt-0">
            {[
              ["Под заказ", "без складского тиража"],
              ["Параметры", "размер · цвет · исполнение"],
              ["Серии", "небольшие и лимитированные"],
              ["Авторство", "собственный дизайн NOIR"],
            ].map(([term, description]) => (
              <div key={term}>
                <dt className="label-caps text-taupe">{term}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink">{description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section className="container-page py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <figure className="overflow-hidden bg-secondary">
            <img
              src={atelierImg}
              alt="Аддитивное производство предметов NOIR ATELIER в мастерской"
              className="h-full w-full object-cover"
            />
          </figure>
          <div>
            <p className="label-caps text-taupe">Наш подход</p>
            <h2 className="display-md mt-4">Премиальный предмет — не обязательно массовый</h2>
            <p className="prose-noir mt-6">
              Цифровая модель позволяет точно управлять пропорциями, рельефом и конструкцией.
              Аддитивное производство делает эту свободу практичной: мы можем выпускать малые серии,
              менять масштаб и не производить лишнего.
            </p>
            <p className="prose-noir mt-4">
              Поэтому NOIR ATELIER соединяет предметный дизайн и технологичное производство в одном
              процессе — от идеи до готового объекта для дома, общественного пространства или
              проекта дизайнера.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-hairline bg-surface">
        <div className="container-page py-16 md:py-24">
          <p className="label-caps text-taupe">В основе каждого изделия</p>
          <div className="mt-8 grid gap-px border border-hairline bg-hairline md:grid-cols-3">
            {[
              [
                "Дизайн",
                "Собственные формы с вниманием к силуэту, тактильности и тому, как предмет работает в интерьере.",
              ],
              [
                "Технология",
                "Цифровое моделирование и точная послойная печать открывают сложную геометрию без компромисса в деталях.",
              ],
              [
                "Кастомизация",
                "Вы выбираете размер и цвет, а для доступных моделей — Standard или функциональное исполнение NOIR SMART.",
              ],
            ].map(([title, text]) => (
              <article key={title} className="bg-background p-7 md:p-9">
                <p className="font-display text-3xl text-foreground">{title}</p>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/catalog" className={ctaStyles}>
              Выбрать изделие
            </Link>
            <Link
              to="/business"
              className="inline-flex items-center justify-center border border-ink/25 px-8 py-4 text-xs font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink"
            >
              Проекты для бизнеса
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
