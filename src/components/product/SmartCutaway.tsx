const steps = [
  ["01", "Залили воду", "Вода попадает в скрытую верхнюю горловину."],
  ["02", "Резервуар заполнен", "Запас воды остаётся ниже корневой системы."],
  ["03", "Влага поднимается", "Капиллярные каналы подают влагу к субстрату."],
  ["04", "Уровень под контролем", "Поплавковый индикатор сверху подсказывает время долива."],
] as const;

export function SmartCutaway() {
  return (
    <section className="border-y border-hairline bg-surface">
      <div className="container-page py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="label-caps text-taupe">Внутри NOIR SMART</p>
          <h2 className="display-md mt-4">Система, которая не спорит с дизайном</h2>
          <p className="prose-noir mt-5">
            Конструкция скрывает уход за растением внутри спокойного внешнего силуэта. Все элементы
            работают без электричества.
          </p>
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)] lg:items-center">
          <figure className="overflow-hidden border border-hairline bg-background p-3 md:p-7">
            <svg
              viewBox="0 0 680 560"
              role="img"
              aria-labelledby="smart-cutaway-title smart-cutaway-description"
              className="h-auto w-full text-ink"
            >
              <title id="smart-cutaway-title">Разрез кашпо NOIR SMART</title>
              <desc id="smart-cutaway-description">
                Посадочная камера, съёмное второе дно, резервуар, опоры с грунтом, заливная
                горловина и вертикальный шток с верхним поплавковым индикатором. Бокового окна нет.
              </desc>
              <defs>
                <linearGradient id="smart-water" x1="0" x2="0" y1="0" y2="1">
                  <stop stopColor="var(--color-sage)" stopOpacity="0.78" />
                  <stop offset="1" stopColor="var(--color-sage-deep)" stopOpacity="0.94" />
                </linearGradient>
                <pattern id="smart-lines" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M0 8 8 0" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                </pattern>
              </defs>
              <path
                d="M160 88h314l-24 365c-2 30-23 51-53 51H237c-30 0-51-21-53-51L160 88Z"
                fill="url(#smart-lines)"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M187 111h260l-18 235H205l-18-235Z"
                fill="var(--color-sand)"
                fillOpacity="0.38"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M213 128h208l-15 190H228l-15-190Z"
                fill="var(--color-background)"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M223 318h188l-9 27H232l-9-27Z" fill="var(--color-ink)" fillOpacity="0.13" />
              <path
                className="smart-water"
                d="M203 347h226l-7 98c-2 19-15 31-35 31H245c-20 0-33-12-35-31l-7-98Z"
                fill="url(#smart-water)"
              />
              <path
                d="M203 347h226l-7 98c-2 19-15 31-35 31H245c-20 0-33-12-35-31l-7-98Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                className="smart-flow"
                d="M265 347v-38m0 0c0-22 19-30 31-12l12 18m76 32v-38m0 0c0-22-19-30-31-12l-12 18"
                fill="none"
                stroke="var(--color-sage-deep)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M420 88h32v345h-32z"
                fill="var(--color-background)"
                fillOpacity="0.7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <g className="smart-float">
                <path d="M436 65v315" stroke="currentColor" strokeWidth="4" />
                <rect
                  x="429"
                  y="44"
                  width="14"
                  height="28"
                  rx="7"
                  fill="#9b3f39"
                  stroke="currentColor"
                />
                <rect x="429" y="50" width="14" height="3" fill="var(--color-sand)" />
                <rect
                  x="423"
                  y="375"
                  width="26"
                  height="35"
                  rx="12"
                  fill="var(--color-sage)"
                  stroke="currentColor"
                />
              </g>
              <path
                d="M375 72h44v82h-44z"
                fill="var(--color-background)"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                className="smart-flow"
                d="M397 72v70"
                stroke="var(--color-sage-deep)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <g className="fill-ink text-[13px]" fontFamily="Manrope, sans-serif" fontSize="13">
                <Line x1="213" y1="130" x2="70" y2="85" label="Посадочная камера" x="18" y="76" />
                <Line x1="172" y1="235" x2="70" y2="235" label="Внешний корпус" x="18" y="226" />
                <Line x1="205" y1="395" x2="70" y2="430" label="Резервуар" x="18" y="421" />
                <Line
                  x1="263"
                  y1="307"
                  x2="70"
                  y2="330"
                  label="Капиллярные каналы"
                  x="18"
                  y="321"
                />
                <Line x1="397" y1="87" x2="545" y2="73" label="Заливная горловина" x="550" y="67" />
                <Line x1="440" y1="242" x2="545" y2="242" label="Канал поплавка" x="550" y="233" />
                <Line x1="442" y1="52" x2="510" y2="25" label="Поплавок сверху" x="515" y="24" />
              </g>
            </svg>
            <figcaption className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Условная схема без масштаба показывает принцип устройства; фактический объём
              резервуара зависит от выбранной модели и размера.
            </figcaption>
          </figure>
          <ol className="grid gap-3" aria-label="Как работает NOIR SMART">
            {steps.map(([number, title, description], index) => (
              <li
                key={number}
                className="smart-step border border-hairline bg-background p-5"
                style={{ "--smart-step-delay": `${index * 1.4}s` } as CSSProperties}
              >
                <span className="label-caps text-sage-deep">{number}</span>
                <h3 className="mt-3 font-display text-3xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Line({
  x1,
  y1,
  x2,
  y2,
  x,
  y,
  label,
}: {
  x1: string | number;
  y1: string | number;
  x2: string | number;
  y2: string | number;
  x: string | number;
  y: string | number;
  label: string;
}) {
  return (
    <>
      <path
        d={`M${x1} ${y1}L${x2} ${y2}`}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      <text x={x} y={y}>
        {label}
      </text>
    </>
  );
}
import type { CSSProperties } from "react";
