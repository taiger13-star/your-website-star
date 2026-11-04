import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { useCatalog } from "@/store/catalog";

export const Route = createFileRoute("/collections")({
  loader: async ({ parentMatchPromise }) => (await parentMatchPromise).loaderData,
  component: Collections,
});

function Collections() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { collections } = useCatalog();
  if (pathname !== "/collections") return <Outlet />;
  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Коллекции" }]} />
      <h1 className="display-lg mt-6">Коллекции NOIR ATELIER</h1>
      <p className="prose-noir mt-5">
        Выберите характер формы, затем — размер, цвет и исполнение изделия.
      </p>
      <div className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link key={c.id} to="/collections/$slug" params={{ slug: c.slug }}>
            {c.cover && (
              <img
                src={c.cover}
                alt={`Коллекция ${c.name}`}
                width={1024}
                height={1280}
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full object-cover"
              />
            )}
            <h2 className="font-display text-3xl mt-5">{c.name}</h2>
            <p className="prose-noir mt-3">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
