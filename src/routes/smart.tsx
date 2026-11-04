import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, Droplets, Gauge, Layers3, Sprout } from "lucide-react";

import smartDetail from "@/assets/smart-detail.jpg";
import { SMART_ARCHIVE_NOTICE } from "@/lib/smart-media";
import { SmartComparison } from "@/components/product/SmartComparison";
import { SmartCutaway } from "@/components/product/SmartCutaway";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ctaGhostStyles, ctaStyles } from "@/components/site/Blocks";
import { getSmartCatalogPrices } from "@/lib/smart-comparison";
import { useCatalog } from "@/store/catalog";

export const Route = createFileRoute("/smart")({
  component: SmartPage,
});

const features = [
  [
    Layers3,
    "Съёмное второе дно",
    "Второе дно с опорами снимается для обслуживания системы автополива.",
  ],
  [
    Droplets,
    "Резервуар воды",
    "Запас воды находится ниже корневой системы и скрыт внешним дизайнерским корпусом.",
  ],
  [
    ArrowDownToLine,
    "Верхний залив",
    "Воду можно долить через сервисную зону сверху — не разбирая кашпо и не тревожа растение.",
  ],
  [
    Gauge,
    "Контроль уровня",
    "Поплавковый индикатор сверху показывает уровень воды и помогает определить, когда пора долить воду.",
  ],
  [
    Sprout,
    "Капиллярная подача",
    "Влага поступает к субстрату постепенно, в естественном для растения темпе, без электричества.",
  ],
] as const;

function SmartPage() {
  const { products } = useCatalog();
  const prices = getSmartCatalogPrices(products);
  return (
    <>
      <div className="container-page pt-10 md:pt-14">
        <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "NOIR SMART" }]} />
        <div className="mt-6 grid gap-10 border-b border-hairline pb-12 lg:grid-cols-[1fr_1.05fr] lg:items-end">
          <div>
            <p className="label-caps text-taupe">NOIR SMART</p>
            <h1 className="display-lg mt-4">Один дизайн. Два сценария ухода.</h1>
            <p className="prose-noir mt-6">
              NOIR SMART — линейка функциональных кашпо с системой контроля воды. Внешний силуэт
              остаётся тем же, что и в Standard-исполнении; внутри появляется продуманная система,
              которая бережно подаёт воду растению.
            </p>
          </div>
          <figure className="overflow-hidden bg-secondary">
            <img
              src={smartDetail}
              alt="Иллюстрация системы автополива NOIR SMART"
              className="h-full w-full object-cover"
            />
            <figcaption className="p-3 text-xs leading-relaxed text-muted-foreground">
              {SMART_ARCHIVE_NOTICE}
            </figcaption>
          </figure>
        </div>
      </div>

      <SmartCutaway />

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,.9fr)_minmax(20rem,1.1fr)] lg:items-end">
          <div>
            <p className="label-caps text-taupe">Выберите сценарий ухода</p>
            <h2 className="display-md mt-4">За что вы платите</h2>
            <p className="prose-noir mt-5">
              Standard сохраняет форму и дренаж. NOIR SMART добавляет полноценную систему ухода за
              растением — без кабелей, насосов и лишних действий.
            </p>
          </div>
          <SmartComparison prices={prices} />
        </div>
      </section>

      <section className="border-y border-hairline bg-surface">
        <div className="container-page py-16 md:py-24">
          <p className="label-caps text-taupe">Как устроено</p>
          <h2 className="display-md mt-4 max-w-3xl">Функциональность скрыта внутри дизайна</h2>
          <div className="mt-10 grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([Icon, title, description], index) => (
              <article key={title} className="bg-background p-7">
                <div className="flex items-center justify-between text-taupe">
                  <Icon className="h-5 w-5" strokeWidth={1.25} />
                  <span className="label-caps">0{index + 1}</span>
                </div>
                <h3 className="mt-7 font-display text-3xl text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{description}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/catalog" search={{ system: "smart" }} className={ctaStyles}>
              Смотреть NOIR SMART
            </Link>
            <Link to="/catalog" className={ctaGhostStyles}>
              Все дизайнерские кашпо
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
