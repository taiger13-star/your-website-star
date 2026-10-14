import { createFileRoute } from "@tanstack/react-router";
import { PriceCalculator } from "@/components/product/PriceCalculator";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Калькулятор стоимости — NOIR ATELIER" },
      {
        name: "description",
        content:
          "Выберите изделие, размер, материал и цвет — стоимость пересчитается автоматически.",
      },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  return (
    <main className="container-page py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Калькулятор стоимости" }]} />
      <div className="mt-10 max-w-3xl">
        <p className="label-caps text-taupe">NOIR ATELIER</p>
        <h1 className="display-md mt-4 text-foreground">Рассчитайте стоимость своего варианта</h1>
        <p className="prose-noir mt-5">
          Выберите изделие, размер, материал и цвет. Итоговая стоимость обновится автоматически.
        </p>
      </div>
      <PriceCalculator className="mt-10" />
    </main>
  );
}
