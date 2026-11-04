import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ProductCard } from "@/components/product/ProductCard";
import { useCatalog } from "@/store/catalog";

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    const collection = parent.loaderData?.collections.find((c) => c.slug === params.slug);
    if (!collection) throw notFound();
    return collection;
  },
  component: Collection,
});

function Collection() {
  const collection = Route.useLoaderData();
  const { products } = useCatalog();
  const items = products.filter((p) => p.collectionSlug === collection.slug && p.variants.length);
  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs
        items={[
          { label: "Главная", to: "/" },
          { label: "Коллекции", to: "/collections" },
          { label: collection.name },
        ]}
      />
      <p className="label-caps mt-6">{collection.tagline}</p>
      <h1 className="display-lg mt-4">{collection.name}</h1>
      <p className="prose-noir mt-5">{collection.description}</p>
      <Link
        to="/catalog"
        search={{ collection: collection.slug }}
        className="mt-6 inline-block underline"
      >
        Подобрать размер, цвет и систему
      </Link>
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 3} />
        ))}
      </div>
      {!items.length && (
        <p className="prose-noir mt-8">
          Изделия этой коллекции пока не опубликованы.{" "}
          <Link to="/catalog" className="underline">
            Посмотреть каталог
          </Link>
        </p>
      )}
    </div>
  );
}
