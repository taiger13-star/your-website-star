import { createFileRoute, Link } from "@tanstack/react-router";
export const Route = createFileRoute("/configurator")({
  component: () => (
    <div className="container-page py-24">
      <h1 className="display-lg">Настройка изделия</h1>
      <p className="prose-noir mt-5">
        Размер, цвет и систему можно выбрать в карточке каждого товара.
      </p>
      <Link to="/catalog" className="mt-8 inline-block underline">
        Открыть каталог
      </Link>
    </div>
  ),
});
