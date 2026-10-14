import { createFileRoute, Link } from "@tanstack/react-router";
export const Route = createFileRoute("/configurator")({
  component: () => (
    <div className="container-page py-24">
      <p className="label-caps text-taupe">NOIR ATELIER</p>
      <h1 className="display-lg mt-4">Индивидуальное исполнение</h1>
      <p className="prose-noir mt-5">
        Размер, цвет корпуса и систему Standard или NOIR SMART можно выбрать в карточке каждого
        изделия. Для изготовления детали или нового предмета по вашей задаче откройте раздел
        3D-печати на заказ.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/3d-printing" className="inline-block underline">
          3D-печать на заказ
        </Link>
        <Link to="/catalog" className="inline-block underline">
          Открыть каталог
        </Link>
        <Link to="/business" className="inline-block underline">
          Обсудить индивидуальный проект
        </Link>
      </div>
    </div>
  ),
});
