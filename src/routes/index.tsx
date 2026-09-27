import { createFileRoute, Link } from "@tanstack/react-router";

import heroImg from "@/assets/hero.jpg";
import smartDetail from "@/assets/smart-detail.jpg";
import atelierImg from "@/assets/atelier.jpg";
import businessImg from "@/assets/business.jpg";
import { BRAND } from "@/lib/brand";
import { BESTSELLERS, COLLECTIONS } from "@/lib/catalog";
import { JsonLd } from "@/components/site/JsonLd";
import { ProductCard } from "@/components/product/ProductCard";
import { ctaGhostStyles, ctaStyles } from "@/components/site/Blocks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: `${BRAND.name} — дизайнерские 3D-печатные кашпо и предметы интерьера`,
      },
      {
        name: "description",
        content:
          "NOIR ATELIER — дизайнерские кашпо, вазы и объекты для интерьера, напечатанные в России под заказ. Коллекции NOIR Essential, Flow, Soft, Architecture, Smart и лимитированные серии.",
      },
      { property: "og:title", content: `${BRAND.name} — ${BRAND.valuesRu}` },
      {
        property: "og:description",
        content: "Дизайнерские кашпо и предметы интерьера, напечатанные в России под заказ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: BRAND.name,
          slogan: BRAND.tagline,
          description: BRAND.heroLine,
          foundingDate: BRAND.founded,
          areaServed: BRAND.country,
        }}
      />

      {/* HERO */}
      <section className="container-page pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="label-caps text-taupe">
              {BRAND.name} · {BRAND.country} · с {BRAND.founded}
            </p>
            <h1 className="display-xl mt-6 text-foreground">{BRAND.tagline}</h1>
            <p className="prose-noir mt-7 max-w-xl">
              {BRAND.heroLine} Мы соединяем параметрический дизайн, цифровое моделирование и
              аддитивное производство: каждое изделие печатается под конкретный заказ — в нужном
              размере, цвете и исполнении.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/catalog" className={ctaStyles}>
                Смотреть каталог
              </Link>
              <Link to="/smart" className={ctaGhostStyles}>
                NOIR Smart
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 border-t border-hairline pt-8 sm:grid-cols-3">
              {[
                ["Производство", "Россия, под заказ"],
                ["Коллекций", `${COLLECTIONS.length}`],
                ["Параметры", "размер · цвет · система"],
              ].map(([term, detail]) => (
                <div key={term}>
                  <dt className="label-caps text-taupe">{term}</dt>
                  <dd className="mt-2 text-sm text-ink">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className="relative">
            <div className="overflow-hidden bg-secondary">
              <img
                src={heroImg}
                alt="Дизайнерские кашпо NOIR ATELIER на поверхности из натурального камня в светлом интерьере"
                width={1108}
                height={1408}
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="label-caps mt-4 text-taupe">
              NOIR Architecture · натуральное освещение, съёмка в интерьере
            </figcaption>
          </figure>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="border-t border-hairline bg-surface">
        <div className="container-page py-16 md:py-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label-caps text-taupe">Коллекции</p>
              <h2 className="display-md mt-4 text-foreground">
                Шесть языков формы — от чистой геометрии до автополива
              </h2>
            </div>
            <Link
              to="/catalog"
              className="text-xs uppercase tracking-[0.18em] text-ink underline underline-offset-4"
            >
              Весь каталог
            </Link>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COLLECTIONS.map((collection, index) => (
              <Link
                key={collection.id}
                to="/catalog"
                search={{ collection: collection.id }}
                className={`group relative overflow-hidden bg-background ${
                  index === 0 ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""
                }`}
              >
                <div
                  className={`overflow-hidden bg-secondary ${
                    index === 0 ? "aspect-[4/3] lg:aspect-[3/4]" : "aspect-[4/3]"
                  }`}
                >
                  <img
                    src={collection.cover}
                    alt={`${collection.name} — ${collection.tagline}`}
                    loading={index < 3 ? "eager" : "lazy"}
                    width={1008}
                    height={1200}
                    className="h-full w-full object-cover hover-zoom-img"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-6">
                  <div>
                    <p className="label-caps text-taupe">{collection.name}</p>
                    <h3 className="mt-2 font-display text-2xl text-foreground">
                      {collection.tagline}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {collection.description}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="mt-1 shrink-0 text-taupe transition-transform duration-500 group-hover:translate-x-1 group-hover:text-ink"
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="container-page py-16 md:py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-caps text-taupe">Выбор NOIR ATELIER</p>
            <h2 className="display-md mt-4 text-foreground">Изделия, которые выбирают чаще всего</h2>
          </div>
          <Link
            to="/catalog"
            search={{ sort: "popular" }}
            className="text-xs uppercase tracking-[0.18em] text-ink underline underline-offset-4"
          >
            Популярные модели
          </Link>
        </div>
        <div className="mt-12 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {BESTSELLERS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* NOIR SMART */}
      <section className="border-y border-hairline bg-ink">
        <div className="container-page py-16 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="overflow-hidden">
              <img
                src={smartDetail}
                alt="Вертикальное прозрачное окно кашпо NOIR Smart с отметками уровня воды"
                loading="lazy"
                width={1408}
                height={1008}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="label-caps text-sand">NOIR Smart</p>
              <h2 className="display-md mt-4 text-sand">Кашпо, которое заботится о растении</h2>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-sand/75">
                Двойной корпус, резервуар около литра воды, верхняя сервисная зона долива и
                вертикальное окно уровня с отметками MAX и MIN. Капиллярная система подаёт воду
                ровно в нужном объёме — без фитилей и без электричества.
              </p>
              <Link
                to="/smart"
                className="mt-9 inline-flex items-center justify-center bg-sand px-8 py-4 text-xs font-medium uppercase tracking-[0.18em] text-ink transition-opacity duration-300 hover:opacity-90"
              >
                Как это работает
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTION */}
      <section className="container-page py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <figure className="order-2 overflow-hidden bg-secondary lg:order-1">
            <img
              src={atelierImg}
              alt="3D-принтер печатает кашпо NOIR ATELIER в мастерской"
              loading="lazy"
              width={1408}
              height={1008}
              className="h-full w-full object-cover"
            />
          </figure>
          <div className="order-1 lg:order-2">
            <p className="label-caps text-taupe">Цифровое производство</p>
            <h2 className="display-md mt-4 text-foreground">
              Малые серии и изделия под заказ — без склада
            </h2>
            <p className="prose-noir mt-6">
              NOIR ATELIER — не огромное промышленное предприятие. Это дизайн, цифровое
              моделирование, аддитивное производство, работа с материалами и функциональностью в
              одном контуре. Модель существует как файл; изделие появляется тогда, когда на него
              есть заказ.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-ink-soft">
              {[
                "Производство по требованию — изделия не лежат на складе",
                "Размер, цвет и система выбираются при оформлении",
                "Малые серии и лимитированные партии",
                "Разработка формы под конкретный интерьерный проект",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <span aria-hidden className="mt-2 h-px w-6 shrink-0 bg-taupe" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/about" className={ctaGhostStyles}>
                О бренде
              </Link>
              <Link to="/configurator" className={ctaStyles}>
                Создайте свой NOIR
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS */}
      <section className="border-t border-hairline bg-surface">
        <div className="container-page py-16 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="label-caps text-taupe">Для бизнеса</p>
              <h2 className="display-md mt-4 text-foreground">
                NOIR ATELIER для дизайн-студий, отелей и девелоперов
              </h2>
              <p className="prose-noir mt-6">
                Индивидуальные размеры, фирменные цвета, нанесение логотипа, малые серии и серийное
                производство, разработка изделия под проект — от эскиза до поставки.
              </p>
              <Link to="/business" className={`${ctaStyles} mt-9`}>
                Обсудить проект
              </Link>
            </div>
            <figure className="overflow-hidden bg-secondary">
              <img
                src={businessImg}
                alt="Кашпо NOIR ATELIER в интерьере гостиничного лобби"
                loading="lazy"
                width={1608}
                height={1008}
                className="h-full w-full object-cover"
              />
            </figure>
          </div>
        </div>
      </section>

      {/* SERVICE STRIP */}
      <section className="container-page py-14">
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Под заказ", "Изделие печатается после подтверждения заказа"],
            ["Доставка", "По России — транспортными компаниями и курьером"],
            ["Параметры", "Размер S–XL, семь цветов корпуса, Standard или Smart"],
            ["Сертификат", "Каждое изделие снабжено сертификатом подлинности"],
          ].map(([title, text]) => (
            <li key={title}>
              <p className="label-caps text-taupe">{title}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
